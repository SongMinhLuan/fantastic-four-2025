package blockchain

import (
	"errors"
	"math/big"

	"invoiceflow/internal/config"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

type Client struct {
	RPC      *ethclient.Client
	ChainID  *big.Int
	Contract common.Address
}

func New(cfg *config.Config) (*Client, error) {
	if !cfg.EnableChain {
		return nil, errors.New("chain disabled")
	}

	if cfg.ChainRPCURL == "" || cfg.ContractInvoiceNFTAddress == "" || cfg.ChainID == 0 {
		return nil, errors.New("chain config missing")
	}

	rpc, err := ethclient.Dial(cfg.ChainRPCURL)
	if err != nil {
		return nil, err
	}

	return &Client{
		RPC:      rpc,
		ChainID:  big.NewInt(cfg.ChainID),
		Contract: common.HexToAddress(cfg.ContractInvoiceNFTAddress),
	}, nil
}
