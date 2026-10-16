# TunnelX local setup

Run the bundled BQC24 app on localhost:

1. Install Node.js 20.19 or later with Corepack enabled.
2. From the repository root, run `corepack pnpm install`.
3. Start the local web and Wisp servers with `corepack pnpm dev`.
4. Open <http://127.0.0.1:4173>.

The web server and Wisp service bind to `127.0.0.1` only. The app's proxy
connects through the local Wisp service on port `8081`; browsing external sites
still requires an internet connection. The Wisp service accepts WebSocket
connections only from the local app origin and blocks private and loopback
destinations. Set `PORT` to change the web port; the Wisp port is fixed at
`8081`.

The setup step copies the Scramjet runtime and proxy transports into the app's
local asset directory. The app uses the local Wisp service instead of the
previous remote Wisp discovery endpoint. Scramjet and bare-mux are
MIT-licensed; Wisp and both transport packages are AGPL-licensed. Review their
license files in `node_modules/@mercuryworkshop/` before redistributing this
project.