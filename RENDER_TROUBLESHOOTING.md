# Rozwiązywanie problemów z bazą danych na Render.com

Jeśli po wdrożeniu aplikacji na Render.com występują błędy serwera przy próbie logowania, wykonaj poniższe kroki:

## 1. Sprawdź logi serwera

1. Przejdź do panelu swojej aplikacji na Render.com
2. Kliknij zakładkę "Logs"
3. Poszukaj błędów związanych z połączeniem do bazy danych

## 2. Sprawdź zmienne środowiskowe

1. Przejdź do zakładki "Environment" w ustawieniach aplikacji
2. Upewnij się, że zmienna `DATABASE_URL` jest poprawnie ustawiona
3. Sprawdź, czy `JWT_SECRET` jest ustawiony

## 3. Ręczna inicjalizacja bazy danych

Jeśli automatyczna inicjalizacja bazy danych nie zadziałała, możesz uruchomić ją ręcznie:

1. Przejdź do zakładki "Shell" w panelu aplikacji
2. Wykonaj polecenie:
   ```
   cd server && npm run init-db
   ```
3. Sprawdź wyniki w konsoli

## 4. Sprawdź połączenie z bazą danych

1. Przejdź do panelu bazy danych na Render.com
2. Sprawdź, czy baza danych jest uruchomiona
3. Skopiuj "External Database URL" i upewnij się, że jest identyczny z tym w zmiennych środowiskowych aplikacji

## 5. Zrestartuj aplikację

1. Przejdź do panelu aplikacji
2. Kliknij przycisk "Manual Deploy" > "Deploy latest commit"
3. Poczekaj na zakończenie procesu wdrażania

## 6. Sprawdź strukturę bazy danych

Jeśli masz dostęp do narzędzia do zarządzania bazą danych (np. pgAdmin):

1. Połącz się z bazą danych używając danych dostępowych z Render.com
2. Sprawdź, czy tabele `users`, `appointments` itd. zostały utworzone
3. Sprawdź, czy istnieje domyślne konto administratora

## 7. Jeśli nic nie pomaga

Możesz zresetować bazę danych i zacząć od nowa:

1. Przejdź do panelu bazy danych na Render.com
2. Kliknij "Reset Database"
3. Potwierdź operację
4. Po zresetowaniu, uruchom ręczną inicjalizację bazy danych (krok 3)
5. Zrestartuj aplikację (krok 5)