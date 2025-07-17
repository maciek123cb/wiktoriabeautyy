# Instrukcja inicjalizacji bazy danych na Render.com

## 1. Utwórz bazę danych PostgreSQL na Render.com

1. Zaloguj się do swojego konta na [Render.com](https://render.com)
2. W panelu głównym wybierz "New" → "PostgreSQL"
3. Wypełnij formularz:
   - Name: beauty-salon-db (lub inna nazwa)
   - Database: beauty_salon
   - User: (zostanie wygenerowany automatycznie)
   - Region: wybierz najbliższy region (np. Frankfurt)
   - Plan: Free (lub inny według potrzeb)
4. Kliknij "Create Database"

## 2. Skonfiguruj zmienne środowiskowe dla backendu

Po utworzeniu bazy danych, Render.com wyświetli dane dostępowe. Użyj ich do skonfigurowania zmiennych środowiskowych w usłudze backendu:

1. Przejdź do swojej usługi backendu na Render.com
2. Wybierz zakładkę "Environment"
3. Dodaj następujące zmienne środowiskowe:
   - `DATABASE_URL`: wartość z pola "External Database URL" z ustawień bazy danych
   - `JWT_SECRET`: bezpieczny ciąg znaków do generowania tokenów JWT
   - `NODE_ENV`: production

## 3. Wdrożenie aplikacji

1. Upewnij się, że Twoje repozytorium zawiera wszystkie pliki, które zostały utworzone:
   - `server/db-postgres.js`
   - `server/db-mysql.js`
   - `server/server-render.js`
   - `server/init-postgres.sql`

2. Zaktualizuj plik `render.yaml` (jeśli używasz):
   ```yaml
   services:
     - type: web
       name: wiktoria-beauty-backend
       env: node
       buildCommand: cd server && npm install
       startCommand: cd server && npm run render-start
       envVars:
         - key: NODE_ENV
           value: production
         - key: JWT_SECRET
           sync: false
         - key: DATABASE_URL
           fromDatabase:
             name: beauty-salon-db
             property: connectionString
   ```

3. Wdróż aplikację na Render.com:
   - Jeśli używasz automatycznego wdrażania z GitHub, wypchnij zmiany do repozytorium
   - Jeśli wdrażasz ręcznie, użyj panelu Render.com do wdrożenia

## 4. Weryfikacja

Po wdrożeniu:
1. Sprawdź logi aplikacji, aby upewnić się, że połączenie z bazą danych zostało nawiązane
2. Przetestuj logowanie z domyślnym kontem administratora:
   - Email: admin@example.com
   - Hasło: password

## Uwagi

- Baza danych PostgreSQL na Render.com w darmowym planie ma limit 1GB przestrzeni
- Baza danych jest automatycznie tworzona i inicjalizowana przy pierwszym uruchomieniu aplikacji
- Jeśli potrzebujesz zresetować bazę danych, możesz użyć opcji "Reset Database" w panelu Render.com