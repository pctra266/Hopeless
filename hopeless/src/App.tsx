import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './App.css'; // Import tệp CSS

// --- 1. Định nghĩa cấu trúc dữ liệu ---
interface Transaction {
  id: string;
  date: number;
  description: string;
  amount: number; // (+) cho 'earn', (-) cho 'spend'
  type: 'earn' | 'spend';
}

// (MỚI) Cấu trúc cho các mục trong "Bảng giá"
interface RewardItem {
  id: string;
  description: string;
  amount: number; // Luôn là số dương
}

// (MỚI) Dữ liệu để backup
interface BackupData {
  balance: number;
  transactions: Transaction[];
  earnItems: RewardItem[];
  spendItems: RewardItem[];
}

// (MỚI) Định nghĩa các màn hình
type View = 'main' | 'earn' | 'spend' | 'settings';


function App() {
  // --- 2. Quản lý trạng thái (State) ---
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // (MỚI) State cho các trang
  const [view, setView] = useState<View>('main');

  // (MỚI) State cho 2 bảng giá
  const [earnItems, setEarnItems] = useState<RewardItem[]>([]);
  const [spendItems, setSpendItems] = useState<RewardItem[]>([]);

  // (MỚI) State riêng cho các form
  const [txDescription, setTxDescription] = useState('');
  const [txAmount, setTxAmount] = useState<number | string>('');

  const [itemDescription, setItemDescription] = useState('');
  const [itemAmount, setItemAmount] = useState<number | string>('');

  // (MỚI) State cho việc chỉnh sửa
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemDescription, setEditItemDescription] = useState('');
  const [editItemAmount, setEditItemAmount] = useState<number | string>('');

  // (MỚI) State cho tìm kiếm và sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'description' | 'amount', direction: 'ascending' | 'descending' } | null>(null);


  // --- 3. Logic Local Storage (Cập nhật) ---

  // Tải dữ liệu khi khởi động
  useEffect(() => {
    const storedData = localStorage.getItem('hopelessCoin_data_v2');
    if (storedData) {
      try {
        const data: BackupData = JSON.parse(storedData);
        setBalance(data.balance || 0);
        setTransactions(data.transactions || []);
        setEarnItems(data.earnItems || []);
        setSpendItems(data.spendItems || []);
      } catch (e) {
        console.error("Lỗi khi đọc LocalStorage:", e);
      }
    }
  }, []);

  // Lưu dữ liệu mỗi khi có thay đổi
  useEffect(() => {
    const data: BackupData = {
      balance,
      transactions,
      earnItems,
      spendItems,
    };
    localStorage.setItem('hopelessCoin_data_v2', JSON.stringify(data));
  }, [balance, transactions, earnItems, spendItems]);


  // --- 4. Logic xử lý nghiệp vụ (Cập nhật) ---

  // Hàm thêm giao dịch (dùng chung)
  const addTransaction = (desc: string, amt: number, type: 'earn' | 'spend') => {
    const finalAmount = type === 'earn' ? Math.abs(amt) : -Math.abs(amt);

    // Kiểm tra nếu chi tiêu
    if (type === 'spend' && balance + finalAmount < 0) {
      alert("Không đủ Hopeless Coin để thực hiện giao dịch này!");
      return false; // Báo hiệu thất bại
    }

    const newTransaction: Transaction = {
      id: new Date().toISOString() + Math.random(),
      date: Date.now(),
      description: desc,
      amount: finalAmount,
      type: type,
    };

    setTransactions([newTransaction, ...transactions]);
    setBalance(balance + finalAmount);
    return true; // Báo hiệu thành công
  };

  // Xử lý form giao dịch chính
  const handleSubmitTransaction = (e: FormEvent, type: 'earn' | 'spend') => {
    e.preventDefault();
    const numAmount = Number(txAmount);
    if (!txDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ.");
      return;
    }
    
    if (addTransaction(txDescription, numAmount, type)) {
      setTxDescription('');
      setTxAmount('');
    }
  };

  // (MỚI) Thêm một mục vào "Bảng giá"
  const handleAddItem = (e: FormEvent, type: 'earn' | 'spend') => {
    e.preventDefault();
    const numAmount = Number(itemAmount);
    if (!itemDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ (luôn là số dương).");
      return;
    }

    const newItem: RewardItem = {
      id: new Date().toISOString() + Math.random(),
      description: itemDescription,
      amount: numAmount,
    };

    if (type === 'earn') {
      setEarnItems([...earnItems, newItem]);
    } else {
      setSpendItems([...spendItems, newItem]);
    }

    setItemDescription('');
    setItemAmount('');
  };
  
  // (MỚI) Xóa một mục khỏi "Bảng giá"
  const handleDeleteItem = (id: string, type: 'earn' | 'spend') => {
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;

    if (type === 'earn') {
      setEarnItems(earnItems.filter(item => item.id !== id));
    } else {
      setSpendItems(spendItems.filter(item => item.id !== id));
    }
  };

  // (MỚI) Bắt đầu chỉnh sửa một mục
  const handleStartEdit = (item: RewardItem) => {
    setEditingItemId(item.id);
    setEditItemDescription(item.description);
    setEditItemAmount(item.amount);
  };

  // (MỚI) Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemDescription('');
    setEditItemAmount('');
  };

  // (MỚI) Cập nhật một mục
  const handleUpdateItem = (type: 'earn' | 'spend') => {
    if (!editingItemId) return;

    const numAmount = Number(editItemAmount);
    if (!editItemDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ (luôn là số dương).");
      return;
    }

    const updatedItem = {
      id: editingItemId,
      description: editItemDescription,
      amount: numAmount,
    };

    if (type === 'earn') {
      setEarnItems(earnItems.map(item => item.id === editingItemId ? updatedItem : item));
    } else {
      setSpendItems(spendItems.map(item => item.id === editingItemId ? updatedItem : item));
    }

    handleCancelEdit(); // Reset form
  };


  // (MỚI) Thêm giao dịch nhanh từ bảng giá
  const quickAdd = (item: RewardItem, type: 'earn' | 'spend') => {
    const verb = type === 'earn' ? 'kiếm' : 'tiêu';
    if (window.confirm(`Xác nhận ${verb} ${item.amount} coin cho: "${item.description}"?`)) {
      addTransaction(item.description, item.amount, type);
    }
  }

  // --- 5. Logic Import / Export JSON (MỚI) ---

  const handleExportData = () => {
    const data: BackupData = {
      balance,
      transactions,
      earnItems,
      spendItems,
    };
    const jsonString = JSON.stringify(data, null, 2); // Định dạng JSON cho đẹp
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `hopeless-coin-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Bạn có chắc muốn nhập dữ liệu mới? TOÀN BỘ dữ liệu hiện tại sẽ bị ghi đè!")) {
      event.target.value = ''; // Reset input
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: BackupData = JSON.parse(text);

        // Xác thực dữ liệu cơ bản
        if (typeof data.balance === 'number' && Array.isArray(data.transactions) && Array.isArray(data.earnItems) && Array.isArray(data.spendItems)) {
          setBalance(data.balance);
          setTransactions(data.transactions);
          setEarnItems(data.earnItems);
          setSpendItems(data.spendItems);
          alert("Nhập dữ liệu thành công!");
          setView('main'); // Quay về trang chủ
        } else {
          throw new Error("File JSON không đúng định dạng.");
        }
      } catch (err) {
        console.error("Lỗi khi nhập file:", err);
        alert("Nhập thất bại. File có thể bị lỗi hoặc không đúng định dạng.");
      } finally {
        event.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  };

  // --- 6. Giao diện (JSX) (Cập nhật) ---

  // (MỚI) Render nội dung chính dựa trên 'view'
  const renderView = () => {
    switch (view) {
      case 'main':
        return renderMainPage();
      case 'earn':
        return renderRewardPage('earn');
      case 'spend':
        return renderRewardPage('spend');
      case 'settings':
        return renderSettingsPage();
      default:
        return renderMainPage();
    }
  };

  // (MỚI) Trang chủ (Trang giao dịch)
  const renderMainPage = () => (
    <>
      {/* === Thẻ Balance Card đã được chuyển ra ngoài === */}

      <div className="main-content">
        {/* === Form Thêm Giao Dịch === */}
        <div className="form-container card">
          <h3>Thêm Giao Dịch Mới</h3>
          <form className="transaction-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="tx-description">Mô tả:</label>
              <input
                type="text"
                id="tx-description"
                value={txDescription}
                onChange={(e) => setTxDescription(e.target.value)}
                placeholder="Ví dụ: Đọc sách 1 tiếng"
              />
            </div>
            <div className="form-group">
              <label htmlFor="tx-amount">Số lượng Coin:</label>
              <input
                type="number"
                id="tx-amount"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                placeholder="Ví dụ: 20"
                min="1"
              />
            </div>
            <div className="form-buttons">
              <button 
                type="submit" 
                className="btn btn-earn"
                onClick={(e) => handleSubmitTransaction(e, 'earn')}
              >
                Kiếm Coin
              </button>
              <button 
                type="submit" 
                className="btn btn-spend"
                onClick={(e) => handleSubmitTransaction(e, 'spend')}
              >
                Chi Tiêu
              </button>
            </div>
          </form>
        </div>

        {/* === Lịch Sử Giao Dịch === */}
        <div className="history-container card">
          <h3>Lịch Sử Giao Dịch</h3>
          <ul className="transaction-list">
            {transactions.length === 0 ? (
              <p>Chưa có giao dịch nào.</p>
            ) : (
              transactions.map((tx) => (
                <li key={tx.id} className={`tx-item ${tx.type}`}>
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-date">
                    {new Date(tx.date).toLocaleDateString('vi-VN')}
                  </span>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === 'earn' ? '+' : ''}{tx.amount.toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  );

  // (MỚI) Trang quản lý Bảng giá (Kiếm và Tiêu)
  const renderRewardPage = (type: 'earn' | 'spend') => {
    const title = type === 'earn' ? 'Bảng Kiếm Coin' : 'Bảng Tiêu Coin';
    const items = type === 'earn' ? earnItems : spendItems;
    const buttonClass = type === 'earn' ? 'btn-earn' : 'btn-spend';

    // (MỚI) Logic Tìm kiếm và Sắp xếp
    // 1. Filter (Search)
    const filteredItems = items.filter(item =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Sort
    const sortedItems = [...filteredItems]; // Tạo mảng mới
    if (sortConfig !== null) {
      sortedItems.sort((a, b) => {
        // Đảm bảo so sánh đúng kiểu dữ liệu
        let valA = sortConfig.key === 'description' ? a.description.toLowerCase() : a.amount;
        let valB = sortConfig.key === 'description' ? b.description.toLowerCase() : b.amount;
        
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    // Hàm yêu cầu sắp xếp
    const requestSort = (key: 'description' | 'amount') => {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
      }
      setSortConfig({ key, direction });
      // (MỚI) Reset trạng thái edit khi sắp xếp
      handleCancelEdit(); 
    };

    // Hàm hiển thị icon sắp xếp
    const getSortIndicator = (key: 'description' | 'amount') => {
      if (!sortConfig || sortConfig.key !== key) return ' ⇕'; // Mặc định
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    return (
      <div className="reward-page">
        {/* === Form thêm mục mới === */}
        <div className="form-container card">
          <h3>Thêm mục vào "{title}"</h3>
          <form className="transaction-form" onSubmit={(e) => handleAddItem(e, type)}>
            <div className="form-group">
              <label htmlFor="item-description">Mô tả:</label>
              <input
                type="text"
                id="item-description"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Mô tả hành động"
              />
            </div>
            <div className="form-group">
              <label htmlFor="item-amount">Số lượng Coin:</label>
              <input
                type="number"
                id="item-amount"
                value={itemAmount}
                onChange={(e) => setItemAmount(e.target.value)}
                placeholder="Luôn là số dương"
                min="1"
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className={`btn ${buttonClass}`}>
                Thêm mục
              </button>
            </div>
          </form>
        </div>
        
        {/* === Danh sách các mục === */}
        <div className="reward-list-container card">
          <h3>Danh sách: {title}</h3>

          {/* (MỚI) Thanh tìm kiếm */}
          <div className="table-controls">
            <input
              type="search"
              placeholder="Tìm theo tên hành động..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* (MỚI) Bảng dữ liệu */}
          <div className="table-responsive">
            <table className="reward-table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th
                    className="col-desc sortable-header"
                    onClick={() => requestSort('description')}
                  >
                    Tên hành động {getSortIndicator('description')}
                  </th>
                  <th
                    className="col-amount sortable-header"
                    onClick={() => requestSort('amount')}
                  >
                    Số lượng Coin {getSortIndicator('amount')}
                  </th>
                  <th className="col-action">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1rem' }}>
                      {items.length === 0 ? "Chưa có mục nào." : "Không tìm thấy kết quả."}
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, index) => (
                    <tr key={item.id} className="reward-item-row">
                      {editingItemId === item.id ? (
                        // (MỚI) Giao diện chỉnh sửa (dùng colSpan)
                        <td colSpan={4}>
                          <div className="item-edit-form">
                            <input
                              type="text"
                              value={editItemDescription}
                              onChange={(e) => setEditItemDescription(e.target.value)}
                              placeholder="Mô tả"
                              className="item-edit-input"
                            />
                            <input
                              type="number"
                              value={editItemAmount}
                              onChange={(e) => setEditItemAmount(e.target.value)}
                              min="1"
                              placeholder="Số lượng"
                              className="item-edit-input amount-input"
                            />
                            <div className="item-actions">
                              <button
                                className="btn-save"
                                onClick={() => handleUpdateItem(type)}
                              >
                                Lưu
                              </button>
                              <button
                                className="btn-cancel"
                                onClick={handleCancelEdit}
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        // Giao diện hiển thị bình thường
                        <>
                          <td>{index + 1}</td>
                          <td className="item-desc">{item.description}</td>
                          <td className={`item-amount ${type}`}>
                            {item.amount.toLocaleString()}
                          </td>
                          <td className="item-actions">
                            <button 
                              className={`btn-quick-add ${type}`}
                              title={type === 'earn' ? 'Kiếm ngay' : 'Tiêu ngay'}
                              onClick={() => quickAdd(item, type)}
                            >
                              {type === 'earn' ? 'KIẾM' : 'TIÊU'}
                            </button>
                            <button
                              className="btn-edit"
                              title="Sửa mục này"
                              onClick={() => handleStartEdit(item)}
                            >
                              Sửa
                            </button>
                            <button 
                              className="btn-delete"
                              title="Xóa mục này"
                              onClick={() => handleDeleteItem(item.id, type)}
                            >
                              Xóa
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // (MỚI) Trang Cài đặt (Import/Export)
  const renderSettingsPage = () => (
    <div className="settings-page card">
      <h3>Cài đặt & Sao lưu Dữ liệu</h3>
      
      <div className="setting-item">
        <h4>Xuất Dữ Liệu (Export)</h4>
        <p>Lưu toàn bộ dữ liệu (số dư, lịch sử, bảng giá) ra file JSON để sao lưu.</p>
        <button className="btn btn-primary" onClick={handleExportData}>
          Tải file Backup (.json)
        </button>
      </div>

      <div className="setting-item">
        <h4>Nhập Dữ Liệu (Import)</h4>
        <p>Khôi phục dữ liệu từ file JSON. <strong style={{color: 'var(--spend-color)'}}>Cảnh báo: Toàn bộ dữ liệu hiện tại sẽ bị ghi đè!</strong></p>
        <input 
          type="file" 
          accept="application/json" 
          onChange={handleImportData} 
        />
      </div>
    </div>
  );


  return (
    <div className="App">
      <header className="header">
        <h1>🪙 Hopeless Coin Manager</h1>
        
        {/* === (MỚI) Thanh điều hướng === */}
        <nav className="navigation">
          <button 
            className={`nav-btn ${view === 'main' ? 'active' : ''}`} 
            onClick={() => setView('main')}
          >
            Trang chủ
          </button>
          <button 
            className={`nav-btn ${view === 'earn' ? 'active' : ''}`} 
            onClick={() => setView('earn')}
          >
            Bảng Kiếm Coin
          </button>
          <button 
            className={`nav-btn ${view === 'spend' ? 'active' : ''}`} 
            onClick={() => setView('spend')}
          >
            Bảng Tiêu Coin
          </button>
          <button 
            className={`nav-btn ${view === 'settings' ? 'active' : ''}`} 
            onClick={() => setView('settings')}
          >
            Cài đặt
          </button>
        </nav>
      </header>

      {/* (MỚI) Thẻ số dư được đưa ra ngoài để luôn hiển thị */}
      {view === 'main' && (
        <div className="balance-card card">
          <h2>Số dư hiện tại</h2>
          <span className="balance-amount">{balance.toLocaleString()}</span>
          <span>Coins</span>
        </div>
      )}

      {/* (MỚI) Thẻ số dư nhỏ hơn hiển thị ở các trang khác */}
      {view !== 'main' && (
        <div className="balance-card-small card">
          <strong>Số dư hiện tại:</strong>
          <span className="balance-amount-small">{balance.toLocaleString()} Coins</span>
        </div>
      )}

      <main>
        {renderView()}
      </main>
    </div>
  );
}

export default App;


