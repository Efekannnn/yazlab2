// Express hata zincirinde taşınan uygulama hatası yapısı
export interface AppError {
  status?: number;   // HTTP durum kodu
  code?: string;     // Makine okunabilir hata kodu (NOT_FOUND, UNAUTHORIZED vb.)
  message?: string;  // İnsan okunabilir açıklama
}
