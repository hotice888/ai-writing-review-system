const { execSync } = require('child_process');

// 要检查的端口，根据启动的服务类型来决定
const adminPorts = [5174]; // 管理端使用的端口
const homePorts = [5173]; // 用户端使用的端口
const backendPorts = [3000]; // 后端使用的端口

function killPorts() {
  console.log('检查并终止占用的端口...');
  
  // 确定当前要启动的服务类型
  const cwd = process.cwd();
  let portsToCheck = [];
  
  if (cwd.includes('adminFrontend')) {
    portsToCheck = adminPorts;
    console.log('启动管理端服务，检查端口:', adminPorts);
  } else if (cwd.includes('homeFrontend')) {
    portsToCheck = homePorts;
    console.log('启动用户端服务，检查端口:', homePorts);
  } else if (cwd.includes('backend')) {
    portsToCheck = backendPorts;
    console.log('启动后端服务，检查端口:', backendPorts);
  } else {
    // 默认检查所有端口
    portsToCheck = [...adminPorts, ...homePorts, ...backendPorts];
    console.log('启动未知服务，检查所有端口:', portsToCheck);
  }
  
  portsToCheck.forEach(port => {
    try {
      // 查找占用端口的进程
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      
      // 提取进程ID
      const lines = result.trim().split('\n');
      const pids = new Set();
      
      lines.forEach(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          pids.add(parts[4]);
        }
      });
      
      // 终止进程
      pids.forEach(pid => {
        try {
          execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf8' });
          console.log(`已终止占用端口 ${port} 的进程 ${pid}`);
        } catch (error) {
          console.error(`终止进程 ${pid} 失败:`, error.message);
        }
      });
    } catch (error) {
      // 没有找到占用端口的进程，这是正常的
      console.log(`端口 ${port} 未被占用`);
    }
  });
  
  console.log('端口检查完成!');
}

// 执行函数
killPorts();
