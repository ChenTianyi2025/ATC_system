// 脚本加载管理器
console.log('🚀 开始加载脚本...');

const scriptLoader = {
    scripts: [
        '/socket.io/socket.io.js',
        '/js/auth.js',
        '/js/data.js', 
        '/js/socket-client.js',
        '/js/common.js',
        '/js/init.js'
    ],
    loaded: {},
    
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loaded[src]) {
                resolve();
                return;
            }
            
            console.log(`📥 加载脚本: ${src}`);
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loaded[src] = true;
                console.log(`✅ 脚本加载完成: ${src}`);
                resolve();
            };
            script.onerror = (error) => {
                console.error(`❌ 脚本加载失败: ${src}`, error);
                reject(error);
            };
            document.head.appendChild(script);
        });
    },
    
    async loadAll() {
        try {
            for (const script of this.scripts) {
                await this.loadScript(script);
                // 给浏览器一点时间处理脚本
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            console.log('🎉 所有脚本加载完成！');
            return true;
        } catch (error) {
            console.error('💥 脚本加载失败:', error);
            return false;
        }
    }
};

// 启动加载过程
scriptLoader.loadAll().then(success => {
    if (success) {
        console.log('🌟 开始初始化应用...');
        // 给所有脚本一点时间初始化
        setTimeout(() => {
            if (typeof initializeApplication === 'function') {
                initializeApplication();
            } else {
                console.error('❌ initializeApplication 函数未找到');
            }
        }, 100);
    }
});