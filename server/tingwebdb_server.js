// TinyWebDB API配置
const TINYWEBDB_CONFIG = {
    apiUrl: 'https://tinywebdb.appinventor.space/api',
    user: 'cty123456',
    secret: 'a46a5f05'
};

/**
 * 上传数据到TinyWebDB
 * @param {string} tag - 变量名
 * @param {any} value - 变量值
 * @returns {Promise} Promise对象，resolve时表示成功，reject时包含错误信息
 */
async function updateToTiny(tag, value) {
    try {
        const formData = new FormData();
        formData.append('user', TINYWEBDB_CONFIG.user);
        formData.append('secret', TINYWEBDB_CONFIG.secret);
        formData.append('action', 'update');
        formData.append('tag', tag);
        formData.append('value', JSON.stringify(value)); // 将值转换为JSON字符串

        const response = await fetch(TINYWEBDB_CONFIG.apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const result = await response.text();
        
        // 更新操作通常没有返回值，如果请求成功则认为操作完成
        if (response.ok) {
            return { success: true, message: '数据上传成功' };
        } else {
            throw new Error(`上传失败: ${result}`);
        }
    } catch (error) {
        console.error('上传数据时发生错误:', error);
        throw error;
    }
}

/**
 * 从TinyWebDB查询数据
 * @param {Object} options - 查询选项（可选）
 * @param {number} options.no - 起始编号，默认为1
 * @param {number} options.count - 变量个数，默认为1
 * @param {string} options.tag - 变量名包含的字符，默认为空
 * @param {string} options.type - 查询类型：tag/value/both，默认为both
 * @returns {Promise} Promise对象，resolve时包含查询结果
 */
async function searchFromTiny(options = {}) {
    try {
        const { 
            no = 1, 
            count = 1, 
            tag = '', 
            type = 'both' 
        } = options;

        const formData = new FormData();
        formData.append('user', TINYWEBDB_CONFIG.user);
        formData.append('secret', TINYWEBDB_CONFIG.secret);
        formData.append('action', 'search');
        formData.append('no', no.toString());
        formData.append('count', count.toString());
        formData.append('tag', tag);
        formData.append('type', type);

        const response = await fetch(TINYWEBDB_CONFIG.apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const result = await response.text();
        
        // 尝试解析返回的JSON数据
        try {
            const parsedResult = JSON.parse(result);
            return { success: true, data: parsedResult };
        } catch (parseError) {
            // 如果解析失败，返回原始文本
            return { success: true, data: result };
        }
    } catch (error) {
        console.error('查询数据时发生错误:', error);
        throw error;
    }
}

/**
 * 从TinyWebDB删除数据
 * @param {string} tag - 要删除的变量名
 * @returns {Promise} Promise对象，resolve时表示成功，reject时包含错误信息
 */
async function deleteFromTiny(tag) {
    try {
        const formData = new FormData();
        formData.append('user', TINYWEBDB_CONFIG.user);
        formData.append('secret', TINYWEBDB_CONFIG.secret);
        formData.append('action', 'delete');
        formData.append('tag', tag);

        const response = await fetch(TINYWEBDB_CONFIG.apiUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP错误! 状态: ${response.status}`);
        }

        const result = await response.text();
        
        if (response.ok) {
            return { success: true, message: `变量 "${tag}" 删除成功` };
        } else {
            throw new Error(`删除失败: ${result}`);
        }
    } catch (error) {
        console.error('删除数据时发生错误:', error);
        throw error;
    }
}


// 导出函数供其他模块使用
module.exports = {
    updateToTiny,
    searchFromTiny,
    deleteFromTiny
};

//例子：
// 上传数据
// updateToTiny('username', '张三')
//     .then(result => console.log('成功:', result.message))
//     .catch(error => console.error('失败:', error));
// // 查询数据（使用默认参数）
// searchFromTiny()
//     .then(result => console.log('查询结果:', result.data));
// // 删除单个变量
// deleteFromTinyWebDB('要删除的变量名')
//     .then(result => console.log(result.message))
//     .catch(error => console.error(error));


// // 查询数据（自定义参数）
// searchFromTiny({
//     no: 1,
//     count: 5,
//     tag: 'user',
//     type: 'both'
// }).then(result => console.log('自定义查询:', result));
