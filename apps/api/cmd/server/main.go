package main

import (
	"log"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/db"
	"github.com/banbunsi/banbunsi/apps/api/internal/seed"
	"github.com/banbunsi/banbunsi/apps/api/internal/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}
	gdb, err := db.Connect(cfg.DatabaseURL, cfg.IsDev())
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(gdb); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	if err := seed.Run(gdb, cfg); err != nil {
		log.Fatalf("seed: %v", err)
	}

	app := server.New(cfg, gdb)
	log.Printf("BAN BUNSI API listening on %s", cfg.APIAddr)
	if err := app.Listen(cfg.APIAddr); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
