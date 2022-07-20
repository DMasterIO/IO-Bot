if (typeof funaStorage === "undefined" || funaStorage === null) {
  const LocalStorage = require("node-localstorage").LocalStorage;
  funaStorage = new LocalStorage("./storage/funas");
}

const express = require("express");
const router = express.Router();

router.get("/funa/:funado", function (req, res) {
  const funado = req.params.funado;
  if (!funado) {
    res.send("error");
    return;
  }

  const newCounter = countAndUpdateFunas(funado);
  funaStorage.setItem(funado, newCounter);
  res.send(`${funado} ha sido funado ${newCounter} veces.`);
});

const countAndUpdateFunas = (funado) => {
  countFunas = funaStorage.getItem(funado);
  return !countFunas ? 1 : parseInt(countFunas) + 1;
};

module.exports = router;
