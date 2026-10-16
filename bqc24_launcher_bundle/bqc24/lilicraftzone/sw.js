importScripts("./scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

self.addEventListener("fetch", async (event) => {
  await scramjet.loadConfig();

  if (scramjet.route(event)) {
    event.respondWith(scramjet.fetch(event));
  }
});
