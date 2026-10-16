BQC24 runs locally from this repository.

From the repository root, run `corepack pnpm install` and then
`corepack pnpm dev`. Open http://127.0.0.1:4173. Keep the bqc24 folder in
place; the install step prepares the missing runtime files. Both local
services listen on loopback, while browsing external sites still needs an
internet connection.
