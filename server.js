// Mini serveur : affiche verif-csu.html et relaie les appels vers l'API CSU (contourne le blocage CORS).
// Aucun module à installer. Lancement : node server.js  puis ouvrir http://localhost:3000
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API = "https://scancarte.sunucsu.sn/api/beneficiairess/codeImmatriculation?code=";
const PAGE = path.join(__dirname, "verif-csu.html");

http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Relais vers l'API
  if (url.pathname === "/api/beneficiaire") {
    const code = (url.searchParams.get("code") || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(code)) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify({ erreur: "Code invalide" }));
    }
    https.get(API + encodeURIComponent(code), { headers: { Accept: "application/json" } }, r => {
      res.writeHead(r.statusCode, { "Content-Type": "application/json; charset=utf-8" });
      r.pipe(res);
    }).on("error", e => {
      res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ erreur: "API injoignable : " + e.message }));
    });
    return;
  }

  // Page principale
  if (url.pathname === "/" || url.pathname === "/verif-csu.html") {
    return fs.readFile(PAGE, (err, data) => {
      if (err) { res.writeHead(500); return res.end("verif-csu.html introuvable à côté de server.js"); }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
  }

  res.writeHead(404); res.end("Introuvable");
}).listen(PORT, () => console.log(`Vérification CSU prête : http://localhost:${PORT}`));
