// Định nghĩa loại Giao dịch
interface Transaction {
    id: string; // ID duy nhất của giao dịch
    date: number; // Thời gian (Timestamp)
    description: string; // Mô tả (Ví dụ: "Đọc sách 1 tiếng" hoặc "Đổi 30 phút chơi game")
    amount: number; // Số lượng Coin (+ cho Kiếm, - cho Chi tiêu)
    type: 'earn' | 'spend'; // Loại giao dịch
  }
  
  // Định nghĩa trạng thái ứng dụng
  interface AppState {
    currentBalance: number; // Số dư Coin hiện tại
    transactions: Transaction[]; // Mảng lưu trữ lịch sử giao dịch
  }