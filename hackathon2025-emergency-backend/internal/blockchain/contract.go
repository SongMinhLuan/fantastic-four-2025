package blockchain

import (
	"context"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

type InvoiceNFT struct {
	contract *bind.BoundContract
}

func NewInvoiceNFT(client *Client) (*InvoiceNFT, error) {
	parsed, err := abi.JSON(strings.NewReader(InvoiceNFTABI))
	if err != nil {
		return nil, err
	}

	bound := bind.NewBoundContract(client.Contract, parsed, client.RPC, client.RPC, client.RPC)
	return &InvoiceNFT{contract: bound}, nil
}

func (nft *InvoiceNFT) Mint(ctx context.Context, auth *bind.TransactOpts, to common.Address, tokenID *big.Int, tokenURI string) (*types.Transaction, error) {
	auth.Context = ctx
	return nft.contract.Transact(auth, "mint", to, tokenID, tokenURI)
}
