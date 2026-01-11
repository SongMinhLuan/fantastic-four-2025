package services

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"strings"
	"time"

	"invoiceflow/internal/blockchain"
	"invoiceflow/internal/config"
	"invoiceflow/internal/domain"
	"invoiceflow/internal/repositories"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/google/uuid"
)

var (
	ErrChainDisabled = errors.New("chain disabled")
)

type ChainService struct {
	cfg         *config.Config
	chainClient *blockchain.Client
	chainRepo   *repositories.ChainRepository
	invoiceRepo *repositories.InvoiceRepository
}

func NewChainService(cfg *config.Config, chainRepo *repositories.ChainRepository, invoiceRepo *repositories.InvoiceRepository) (*ChainService, error) {
	var client *blockchain.Client
	if cfg.EnableChain {
		c, err := blockchain.New(cfg)
		if err != nil {
			return nil, err
		}
		client = c
	}

	return &ChainService{
		cfg:         cfg,
		chainClient: client,
		chainRepo:   chainRepo,
		invoiceRepo: invoiceRepo,
	}, nil
}

func (s *ChainService) TokenizeInvoice(ctx context.Context, invoiceID string) (*domain.InvoiceOnChain, *domain.ChainTx, bool, error) {
	if !s.cfg.EnableChain {
		return nil, nil, false, ErrChainDisabled
	}

	invoice, err := s.invoiceRepo.GetByID(ctx, invoiceID)
	if err != nil {
		return nil, nil, false, err
	}

	existing, err := s.chainRepo.GetOnchainByInvoiceID(ctx, invoiceID)
	if err == nil && existing != nil {
		tx := (*domain.ChainTx)(nil)
		if existing.MintTxHash != nil {
			tx, _ = s.chainRepo.GetChainTx(ctx, *existing.MintTxHash)
		}
		return existing, tx, true, nil
	}
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, nil, false, err
	}

	if invoice.Status != domain.InvoiceStatusApproved {
		return nil, nil, false, ErrInvoiceInvalidStatus
	}

	if s.chainClient == nil {
		return nil, nil, false, ErrChainDisabled
	}

	auth, fromAddress, err := s.buildTransactor()
	if err != nil {
		return nil, nil, false, err
	}

	tokenID, err := tokenIDFromInvoice(invoice.ID)
	if err != nil {
		return nil, nil, false, err
	}

	tokenURI, err := buildTokenURI(invoice)
	if err != nil {
		return nil, nil, false, err
	}

	nft, err := blockchain.NewInvoiceNFT(s.chainClient)
	if err != nil {
		return nil, nil, false, err
	}

	tx, err := nft.Mint(ctx, auth, fromAddress, tokenID, tokenURI)
	if err != nil {
		return nil, nil, false, err
	}

	txHash := tx.Hash().Hex()
	tokenIDStr := tokenID.String()

	onchain := &domain.InvoiceOnChain{
		InvoiceID:       invoice.ID,
		ContractAddress: s.chainClient.Contract.Hex(),
		TokenID:         &tokenIDStr,
		MintTxHash:      &txHash,
		ChainStatus:     domain.ChainStatusPending,
	}

	createdOnchain, err := s.chainRepo.CreateOnchain(ctx, onchain)
	if err != nil {
		return nil, nil, false, err
	}

	chainTx := &domain.ChainTx{
		TxHash:      txHash,
		Type:        "MINT",
		Status:      domain.ChainStatusPending,
		ReceiptJSON: []byte("null"),
	}

	createdTx, err := s.chainRepo.CreateChainTx(ctx, chainTx)
	if err != nil {
		return nil, nil, false, err
	}

	return createdOnchain, createdTx, false, nil
}

func (s *ChainService) GetOnchain(ctx context.Context, invoiceID string) (*domain.InvoiceOnChain, error) {
	if !s.cfg.EnableChain {
		return nil, ErrChainDisabled
	}

	return s.chainRepo.GetOnchainByInvoiceID(ctx, invoiceID)
}

func (s *ChainService) RefreshOnchain(ctx context.Context, invoiceID string) (*domain.InvoiceOnChain, *domain.ChainTx, error) {
	if !s.cfg.EnableChain {
		return nil, nil, ErrChainDisabled
	}

	record, err := s.chainRepo.GetOnchainByInvoiceID(ctx, invoiceID)
	if err != nil {
		return nil, nil, err
	}

	if record.MintTxHash == nil {
		return record, nil, nil
	}

	if s.chainClient == nil {
		return nil, nil, ErrChainDisabled
	}

	receipt, err := s.chainClient.RPC.TransactionReceipt(ctx, common.HexToHash(*record.MintTxHash))
	if err != nil {
		if errors.Is(err, ethereum.NotFound) {
			tx, _ := s.chainRepo.GetChainTx(ctx, *record.MintTxHash)
			return record, tx, nil
		}
		return nil, nil, err
	}

	receiptJSON, err := json.Marshal(receipt)
	if err != nil {
		return nil, nil, err
	}

	now := time.Now()
	status := domain.ChainStatusFailed
	var mintedAt *time.Time
	if receipt.Status == 1 {
		status = domain.ChainStatusConfirmed
		mintedAt = &now
	}

	updatedOnchain, err := s.chainRepo.UpdateOnchainStatus(ctx, invoiceID, status, mintedAt)
	if err != nil {
		return nil, nil, err
	}

	var errMsg *string
	if receipt.Status == 0 {
		msg := "transaction reverted"
		errMsg = &msg
	}

	updatedTx, err := s.chainRepo.UpdateChainTx(ctx, *record.MintTxHash, status, errMsg, receiptJSON, &now)
	if err != nil {
		return nil, nil, err
	}

	if status == domain.ChainStatusConfirmed {
		_, _ = s.invoiceRepo.UpdateStatus(ctx, invoiceID, domain.InvoiceStatusTokenized)
	}

	return updatedOnchain, updatedTx, nil
}

func (s *ChainService) buildTransactor() (*bind.TransactOpts, common.Address, error) {
	if s.cfg.ChainPrivateKey == "" {
		return nil, common.Address{}, errors.New("CHAIN_PRIVATE_KEY is required to mint")
	}

	keyHex := strings.TrimPrefix(s.cfg.ChainPrivateKey, "0x")
	key, err := crypto.HexToECDSA(keyHex)
	if err != nil {
		return nil, common.Address{}, err
	}

	from := crypto.PubkeyToAddress(key.PublicKey)
	auth, err := bind.NewKeyedTransactorWithChainID(key, s.chainClient.ChainID)
	if err != nil {
		return nil, common.Address{}, err
	}

	auth.Context = context.Background()
	return auth, from, nil
}

func tokenIDFromInvoice(invoiceID string) (*big.Int, error) {
	parsed, err := uuid.Parse(invoiceID)
	if err != nil {
		return nil, err
	}

	return new(big.Int).SetBytes(parsed[:]), nil
}

func buildTokenURI(invoice *domain.Invoice) (string, error) {
	metadata := map[string]interface{}{
		"name":        invoice.Title,
		"description": "InvoiceFlow invoice token",
		"invoice_id":  invoice.ID,
		"amount":      invoice.Amount,
		"currency":    invoice.Currency,
		"issuer_id":   invoice.IssuerID,
		"due_date":    invoice.DueDate.Format("2006-01-02"),
		"risk_tier":   invoice.RiskTier,
	}

	payload, err := json.Marshal(metadata)
	if err != nil {
		return "", err
	}

	encoded := base64.StdEncoding.EncodeToString(payload)
	return "data:application/json;base64," + encoded, nil
}

func (s *ChainService) Client() *ethclient.Client {
	if s.chainClient == nil {
		return nil
	}
	return s.chainClient.RPC
}
