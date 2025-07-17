# Rozwiązywanie problemów z bazą danych na Render.com

## Problem

Jeśli po wdrożeniu aplikacji na Render.com występują błędy serwera przy próbie logowania, może to być spowodowane problemem z połączeniem do bazy danych PostgreSQL lub różnicami w składni SQL między MySQL a PostgreSQL.

## Rozwiązanie

Przygotowaliśmy specjalny adapter, który automatycznie konwertuje zapytania MySQL na format PostgreSQL. Adapter ten jest używany tylko w środowisku produkcyjnym (na Render.com).

### Pliki, które zostały dodane/zmodyfikowane:

1. `db-adapter.js` - adapter dla PostgreSQL
2. `server-render.js` - zmodyfikowany serwer, który używa adaptera
3. `init-db-render.js` - skrypt do inicjalizacji bazy danych
4. `fix-db-adapter.js` - skrypt do naprawy problemów z bazą danych

### Jak wdrożyć zmiany:

1. Wypchnij wszystkie zmiany do repozytorium GitHub
2. Poczekaj na automatyczne wdrożenie na Render.com lub uruchom wdrożenie ręcznie
3. Sprawdź logi aplikacji, aby upewnić się, że połączenie z bazą danych zostało nawiązane

### Jeśli problem nadal występuje:

1. Przejdź do panelu Render.com
2. Wybierz swoją aplikację
3. Przejdź do zakładki "Environment"
4. Upewnij się, że zmienna `DATABASE_URL` jest poprawnie ustawiona
5. Przejdź do zakładki "Manual Deploy"
6. Kliknij "Deploy latest commit"

## Testowanie

Po wdrożeniu, spróbuj zalogować się używając domyślnego konta administratora:
- Email: admin@example.com
- Hasło: password

## Uwagi

- Baza danych PostgreSQL na Render.com w darmowym planie ma limit 1GB przestrzeni
- Tabele są tworzone automatycznie przy pierwszym uruchomieniu aplikacji
- Domyślne konto administratora jest również tworzone automatycznie