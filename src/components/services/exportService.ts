import { Share, Platform, Alert } from 'react-native';

// Funkcja pomocnicza do pobierania i udostępniania plików CSV
export async function exportToCSV(filename: string, csvData: string) {
  try {
    if (Platform.OS === 'web') {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Dla iOS / Android udostępniamy wygenerowaną treść raportu tekstowo/CSV
      await Share.share({
        title: filename,
        message: csvData,
      });
    }
  } catch (error) {
    console.error('Błąd eksportu CSV:', error);
    Alert.alert('Błąd eksportu', 'Nie udało się wygenerować raportu.');
  }
}

// 1. Generator CSV dla Wyników Testów Motorycznych
export function generateTestResultsCSV(testResults: any[], players: any[]) {
  const headers = ['Data', 'Zawodnik', 'Nazwa Testu', 'Typ', 'Wynik'];
  const rows = testResults.map((t) => {
    const player = players.find((p) => p.id === t.playerId);
    return [
      t.date || '',
      `"${player?.name || 'Nieznany'}"`,
      `"${t.testName || t.name || ''}"`,
      `"${t.testType || 'Motoryczny'}"`,
      `"${t.resultValue || t.value || ''}"`,
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

// 2. Generator CSV dla Składek i Finansów
export function generateFeesCSV(fees: any[], players: any[]) {
  const headers = ['Miesiąc', 'Zawodnik', 'Kwota (PLN)', 'Status'];
  const rows = fees.map((f) => {
    const player = players.find((p) => p.id === f.playerId);
    return [
      `"${f.month || ''}"`,
      `"${player?.name || 'Nieznany'}"`,
      f.amount || 0,
      f.paid ? 'OPŁACONE' : 'BRAK WPŁATY',
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

// 3. Generator CSV dla Kadry Zawodników
export function generatePlayersCSV(players: any[]) {
  const headers = ['Imię i Nazwisko', 'Numer', 'Pozycja', 'Rola', 'Rok urodzenia', 'Telefon rodzica'];
  const rows = players.map((p) => [
    `"${p.name || ''}"`,
    p.number || '',
    `"${p.position || ''}"`,
    `"${p.role || ''}"`,
    p.birthYear || '',
    `"${p.parentPhone || ''}"`,
  ].join(';'));

  return [headers.join(';'), ...rows].join('\n');
}