// Prosty serwer Express do obsługi aplikacji SPA na Render.com
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serwuj pliki statyczne z folderu dist
app.use(express.static(path.join(__dirname, 'dist')));

// Wszystkie pozostałe żądania przekieruj do index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
});