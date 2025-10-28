import { useState, useEffect,type FormEvent} from 'react';
import './App.css'; // Import tệp CSS
import { supabase } from './supabaseClient'

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

// (MỚI) Định nghĩa các màn hình
type View = 'main' | 'earn' | 'spend' ;


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

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: 'description' | 'amount', direction: 'ascending' | 'descending' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let { data: profile, error: profileError } = await supabase
          .from('profile')
          .select('balance')
          .single(); 
  
        if (profileError) throw profileError;
  
        let { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false });
  
        let { data: earnItems, error: earnError } = await supabase
          .from('earnItems')
          .select('*');
  
        let { data: spendItems, error: spendError } = await supabase
          .from('spendItems')
          .select('*');
  
        if (txError || earnError || spendError) throw txError || earnError || spendError;
  
        // Cập nhật state
        setBalance(profile?.balance || 0);
        setTransactions(transactions || []);
        setEarnItems(earnItems || []);
        setSpendItems(spendItems || []);
  
      } catch (e) {
        console.error("Lỗi khi tải dữ liệu từ Supabase:", e);
        alert("Không thể kết nối đến cơ sở dữ liệu.");
      }
    };
    fetchData();
  }, []);
// Hàm thêm giao dịch (CẬP NHẬT CHO SUPABASE)
const addTransaction = async (desc: string, amt: number, type: 'earn' | 'spend') => {
  const finalAmount = type === 'earn' ? Math.abs(amt) : -Math.abs(amt);

  if (type === 'spend' && balance + finalAmount < 0) {
    alert("Không đủ Hopeless Coin để thực hiện giao dịch này!");
    return false; // Báo hiệu thất bại
  }

  const newBalance = balance + finalAmount;

  const newTransaction: Transaction = {
    id: new Date().toISOString() + Math.random(), 
    date: Date.now(),
    description: desc,
    amount: finalAmount,
    type: type,
  };
  
  try {
    // 1. Gửi giao dịch mới lên Supabase
    const { error: txError } = await supabase
      .from('transactions')
      .insert(newTransaction);

    if (txError) throw txError; // Nếu lỗi thì dừng lại

    // 2. Cập nhật số dư mới lên Supabase
    // RẤT QUAN TRỌNG: Giả sử dòng 'profile' của bạn có một cột 'id' với giá trị là 1.
    // Hãy kiểm tra lại Bảng 'profile' trên Supabase của bạn!
    const { error: profileError } = await supabase
      .from('profile')
      .update({ balance: newBalance })
      .eq('id', 1); // Bạn cần một cột để lọc (ví dụ: id = 1)

    if (profileError) throw profileError; // Nếu lỗi thì dừng lại

    // 3. Cập nhật state ở local (nếu cả 2 API đều thành công)
    setTransactions([newTransaction, ...transactions]);
    setBalance(newBalance);
    return true; // Báo hiệu thành công

  } catch (e) {
    console.error(e);
    alert("Đã xảy ra lỗi khi lưu giao dịch!");
    return false;
  }
};


  // --- 4. Logic xử lý nghiệp vụ (Cập nhật) ---


  // Xử lý form giao dịch chính
  // SỬA LẠI
  const handleSubmitTransaction = async (e: FormEvent, type: 'earn' | 'spend') => {
    e.preventDefault();
    const numAmount = Number(txAmount);
    if (!txDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ.");
      return;
    }
    
    // Thêm 'await' để đợi kết quả (true/false) từ API
    const isSuccess = await addTransaction(txDescription, numAmount, type);

    if (isSuccess) {
      setTxDescription('');
      setTxAmount('');
    }
  };

  // (MỚI) Thêm một mục vào "Bảng giá"
  // Thêm một mục vào "Bảng giá" (CẬP NHẬT)
  const handleAddItem = async (e: FormEvent, type: 'earn' | 'spend') => {
    e.preventDefault();
    const numAmount = Number(itemAmount);
    if (!itemDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ.");
      return;
    }

    const newItem = {
      // id: new Date()... (Supabase có thể tự tạo ID, nhưng dùng cách cũ vẫn ổn)
      id: new Date().toISOString() + Math.random(),
      description: itemDescription,
      amount: numAmount,
    };
  
    const tableName = type === 'earn' ? 'earnItems' : 'spendItems';
  
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newItem)
        .select(); // .select() để nó trả về item vừa tạo
  
      if (error) throw error;
  
      // Cập nhật state
      if (type === 'earn') {
        setEarnItems([...earnItems, data[0]]);
      } else {
        setSpendItems([...spendItems, data[0]]);
      }
  
      // ... (xóa form)
    } catch (e) {
      console.error("Lỗi khi thêm mục:", e);
      alert("Đã xảy ra lỗi khi lưu mục mới.");
    }
  };
  
  // (MỚI) Xóa một mục khỏi "Bảng giá"
  // Xóa một mục khỏi "Bảng giá" (CẬP NHẬT)
  const handleDeleteItem = async (id: string, type: 'earn' | 'spend') => {
    if (!window.confirm("Bạn có chắc muốn xóa mục này?")) return;

    const tableName = type === 'earn' ? 'earnItems' : 'spendItems';

    try {
      const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id); // eq = equals (bằng)

      if (error) throw error;

      // Cập nhật state
      if (type === 'earn') {
        setEarnItems(earnItems.filter(item => item.id !== id));
      } else {
        setSpendItems(spendItems.filter(item => item.id !== id));
      }

    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi xóa.");
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
  // Cập nhật một mục (CẬP NHẬT)
  // Cập nhật một mục (CẬP NHẬT CHO SUPABASE)
  const handleUpdateItem = async (type: 'earn' | 'spend') => {
    if (!editingItemId) return;

    const numAmount = Number(editItemAmount);
    if (!editItemDescription || !numAmount || numAmount <= 0) {
      alert("Vui lòng nhập mô tả và số lượng coin hợp lệ.");
      return;
    }

    // Chỉ gửi các trường cần cập nhật
    const updates = {
      description: editItemDescription,
      amount: numAmount,
    };

    const tableName = type === 'earn' ? 'earnItems' : 'spendItems';

    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', editingItemId)
        .select(); // Yêu cầu Supabase trả về dòng vừa được cập nhật

      if (error) throw error;

      const updatedItemFromDB = data[0]; // Lấy item đã được cập nhật từ DB

      // Cập nhật state
      if (type === 'earn') {
        setEarnItems(earnItems.map(item => item.id === editingItemId ? updatedItemFromDB : item));
      } else {
        setSpendItems(spendItems.map(item => item.id === editingItemId ? updatedItemFromDB : item));
      }

      handleCancelEdit(); // Reset form

    } catch (e) {
      console.error(e);
      alert("Đã xảy ra lỗi khi cập nhật.");
    }
  };


  // (MỚI) Thêm giao dịch nhanh từ bảng giá
  // SỬA LẠI
  const quickAdd = async (item: RewardItem, type: 'earn' | 'spend') => {
    const verb = type === 'earn' ? 'kiếm' : 'tiêu';
    if (window.confirm(`Xác nhận ${verb} ${item.amount} coin cho: "${item.description}"?`)) {
      // Thêm 'await' để đảm bảo nó chạy xong
      // Bạn có thể thêm try/catch ở đây nếu muốn
      await addTransaction(item.description, item.amount, type);
    }
  }
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


