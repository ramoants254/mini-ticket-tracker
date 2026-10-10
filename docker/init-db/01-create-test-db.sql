-- Runs once, on first container start (empty data volume only).
-- Creates an isolated database for integration tests so they never touch dev data.
CREATE DATABASE tickets_test;
