# Med_DB

## Wymagania
- Node.js w wersji 18 lub nowszej **lub** Python w wersji 3.10 lub nowszej (do uruchomienia lokalnego serwera)
- Nowoczesna przeglądarka internetowa z obsługą `localStorage`

## Instrukcje uruchomienia
1. Sklonuj repozytorium i przejdź do katalogu projektu.
2. Uruchom prosty serwer HTTP:
   - Node.js: `npx serve` lub `npx http-server`
   - Python: `python -m http.server 8000`
3. Otwórz w przeglądarce adres `http://localhost:8000/index.html` (lub odpowiedni port).
4. Zaloguj się używając jednego z kont demonstracyjnych.

## Funkcje aplikacji
- Logowanie i obsługa ról użytkowników (administrator, lekarz, pielęgniarka, obserwator)
- Przegląd i wyszukiwanie listy pacjentów
- Szczegółowy profil pacjenta z historią medyczną, wynikami badań i komentarzami
- Dodawanie wpisów medycznych, wyników badań i komentarzy
- Panel administratora do zarządzania użytkownikami i uprawnieniami

## Przykładowe dane testowe
```json
{
  "id": 1,
  "firstName": "Jan",
  "lastName": "Kowalski",
  "pesel": "80010112345",
  "dateOfBirth": "1980-01-01"
}
```

## Konta demonstracyjne
| Rola | Login | Hasło |
|------|-------|-------|
| Administrator | `admin` | `admin123` |
| Lekarz | `dr.smith` | `doctor123` |
| Pielęgniarka | `nurse.anna` | `nurse123` |
| Obserwator | `viewer.tom` | `viewer123` |

Zaloguj się przez formularz logowania, wpisując odpowiednią nazwę użytkownika i hasło lub używając przycisków kont demo.

## Znane ograniczenia
- Brak backendu – dane przechowywane są wyłącznie w `localStorage`
- Brak trwałego logowania i szyfrowania danych
- Brak testów automatycznych
- Ograniczone zarządzanie użytkownikami (brak edycji/usuwania)

## Plan rozwoju
- Integracja z backendowym API i bazą danych
- Wprowadzenie autentykacji i szyfrowania danych
- Rozbudowa panelu administratora o pełne zarządzanie użytkownikami
- Dodanie testów jednostkowych i integracyjnych
- Udoskonalenie interfejsu użytkownika i wsparcie dla urządzeń mobilnych

