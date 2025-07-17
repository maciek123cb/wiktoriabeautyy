# Wdrożenie aplikacji na Render.com

## Przygotowanie

1. Utwórz konto na [Render.com](https://render.com)
2. Połącz swoje konto GitHub z Render.com

## Wdrożenie backendu

1. W panelu Render.com wybierz "New Web Service"
2. Wybierz repozytorium z kodem aplikacji
3. Skonfiguruj usługę:
   - Name: wiktoria-beauty-backend
   - Environment: Node
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm run render-start`
   - Plan: Free (lub inny według potrzeb)

4. Dodaj zmienne środowiskowe:
   - JWT_SECRET
   - DB_HOST
   - DB_USER
   - DB_PASSWORD
   - DB_NAME
   - NODE_ENV=production

5. Kliknij "Create Web Service"

## Wdrożenie frontendu

1. W panelu Render.com wybierz "New Static Site"
2. Wybierz to samo repozytorium
3. Skonfiguruj usługę:
   - Name: wiktoria-beauty-frontend
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: Free (lub inny według potrzeb)

4. Kliknij "Create Static Site"

## Konfiguracja bazy danych

1. W panelu Render.com wybierz "New PostgreSQL" lub użyj zewnętrznej bazy MySQL
2. Skonfiguruj bazę danych i zapisz dane dostępowe
3. Zaktualizuj zmienne środowiskowe w ustawieniach backendu

## Uwagi

- Aplikacja została skonfigurowana tak, aby automatycznie używać odpowiednich ścieżek API w zależności od środowiska
- W środowisku produkcyjnym frontend i backend powinny być hostowane na tej samej domenie lub skonfigurowane z odpowiednimi nagłówkami CORS