package main

import (
	"log"

	"github.com/banbunsi/banbunsi/apps/api/internal/config"
	"github.com/banbunsi/banbunsi/apps/api/internal/db"
	"github.com/banbunsi/banbunsi/apps/api/internal/seed"
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
		log.Fatalf("seed base: %v", err)
	}
	if err := seed.ReseedDocuments(gdb); err != nil {
		log.Fatalf("reseed documents: %v", err)
	}
	if err := seed.ReseedQuizzes(gdb); err != nil {
		log.Fatalf("reseed quizzes: %v", err)
	}
	log.Println("Demo documents and quizzes reseeded successfully.")
}
