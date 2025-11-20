// Environment cho Android
// File này sẽ được sử dụng khi build cho Android
// Sử dụng IP thực tế của máy tính thay vì localhost

// Lưu ý: Thay đổi IP này thành IP Wi-Fi của máy tính bạn
// Để lấy IP: Windows: ipconfig | Mac/Linux: ifconfig
export const environment = {
  production: false,
  // Thay đổi IP này thành IP Wi-Fi của máy tính bạn
  // Ví dụ: 'http://192.168.1.100:8080/api'
  apiUrl: 'http://YOUR_COMPUTER_IP:8080/api', // ⚠️ THAY ĐỔI IP NÀY!
};

