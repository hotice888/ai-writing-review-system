const fs = require('fs');
const path = require('path');

// 读取Vite配置文件，获取端口信息
function getPortFromViteConfig(configPath) {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const portMatch = configContent.match(/port:\s*(\d+)/);
    return portMatch ? parseInt(portMatch[1]) : null;
  } catch (error) {
    console.error(`读取配置文件失败: ${configPath}`, error);
    return null;
  }
}

// 更新.env文件中的配置
function updateEnvFile(envPath, key, value) {
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // 检查是否已存在该配置
    const regex = new RegExp(`${key}=.*`);
    if (regex.test(envContent)) {
      // 更新现有配置
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // 添加新配置
      if (envContent && !envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`更新配置文件 ${envPath}: ${key}=${value}`);
  } catch (error) {
    console.error(`更新配置文件失败: ${envPath}`, error);
  }
}

// 主函数
function main() {
  // 获取各服务的端口
  const adminPort = getPortFromViteConfig(path.join(__dirname, 'adminFrontend', 'vite.config.ts'));
  const homePort = getPortFromViteConfig(path.join(__dirname, 'homeFrontend', 'vite.config.ts'));
  
  if (adminPort && homePort) {
    // 构建地址
    const adminUrl = `http://localhost:${adminPort}`;
    const homeUrl = `http://localhost:${homePort}`;
    
    // 更新homeFrontend的.env文件
    updateEnvFile(
      path.join(__dirname, 'homeFrontend', '.env'),
      'VITE_ADMIN_BASE_URL',
      adminUrl
    );
    
    // 可以在这里添加更新adminFrontend的配置，如需
    // updateEnvFile(
    //   path.join(__dirname, 'adminFrontend', '.env'),
    //   'VITE_HOME_BASE_URL',
    //   homeUrl
    // );
    
    console.log('配置更新完成!');
    console.log('注意: 如果端口被占用，Vite会自动使用其他端口，请确保实际运行的端口与配置一致。');
  } else {
    console.error('无法获取服务端口信息');
  }
}

// 执行主函数
main();
