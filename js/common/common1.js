/**
 * 判断obj是不是一个空对象{}，null， undefined,是返回true，不是返回false
 * @param {Object} obj
 */
function isEmpty(obj) {

    if (!obj) return true;

    if (typeof obj == 'string' || obj instanceof String) {
        return trim(obj) == '';
    }

    if (typeof obj == 'function' || obj instanceof Function) {
        return !obj;
    }

    if (typeof obj == 'array' || obj instanceof Array) {
        return obj.length == 0;
    }

    var attr;
    for (attr in obj) return false;
    return true;
}
/**
 * 删除字符串str两端的空格
 * @param {String} str
 * @return 返回删除了两端空格的字符串
 */
function trim(str) {
    var n = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    return null == str ? "" : (str + "").replace(n, "");
}


/**
 *
 * @param {Boolean} checkLogin 可选,是否检查登录
 * @param {String} name 必填，打开的窗口名称
 * @param {String} url 可选，打开的窗口路径
 * @param {Boolean} reload    可选，表示是否重新加载被打开的页面，默认为false
 * @param {Object} pageParam 可选，用于向所打开的页面传递参数，在打开的页面中可以通过【api.pageParam.参数名】 获取对应的值
 */
function openWin(checkLogin, name, url, reload, pageParam) {
    // 没传checkLogin参数
    if (typeof checkLogin != 'boolean') {
        pageParam = reload;
        reload = url;
        url = name;
        name = checkLogin;
        checkLogin = false;
    }
    // 窗口名称不存在，则返回
    if (isEmpty(name)) return;

    // 不传url参数
    if (url && typeof url != 'string') {
        if (typeof url == 'boolean') {
            pageParam = reload;
            reload = url;
        } else {
            pageParam = url;
        }
        url = null;
    }
    //不传reload参数
    if (reload && typeof reload != 'boolean') {
        pageParam = reload;
        reload = false;
    }

    if (checkLogin) {
        //检查是否登录,如果没有登录,则选择去登录页面,并终止运行后面的代码
        if (!checkLogined()) return;
    }

    var params = {
        name: name.replace(/\.\.\//g, "").replace(/\//g, "_"),
        url: url || name + ".html",
        opaque: true,
        allowEdit: true,
        animation: {
            type: "none",
            subType: "from_right",
            duration: 100
        },
        scrollToTop: true,
        slidBackEnabled: false,
        vScrollBarEnabled: false,
        hScrollBarEnabled: false,
        reload: !!reload
    };
    if (pageParam) {
        params.pageParam = pageParam;
    }
    api.openWin(params);
}
/**
 * @param {String} message 可选，关闭窗口时的提示信息
 * @param {Array} buttons    可选，如果和message参数一起使用，用于关闭窗口前按钮，默认为["确定", "取消"]
 * @param {Function} closeback 可选，关闭窗口时的回调函数
 */
function closeWin(message, buttons, closeback) {

    if (message && typeof message != 'function') {

        buttons = buttons || ["确定", "取消"];
        if (buttons && typeof buttons == 'function') {
            closeback = buttons;
            buttons = ["确定", "取消"];
        }
        api.confirm({
            "title": "提醒",
            "msg": message,
            "buttons": buttons
        }, function (ret, err) {
            if (ret.buttonIndex == 1) { //确定
                api.removeEventListener({
                    name: 'viewappear'
                });
                closeback && closeback(true);

                removeDefaultListeners();
                api.closeWin({
                    animation: {
                        type: "movein",
                        subType: "from_left",
                        duration: 100
                    }
                });
            } else { // 取消
                closeback && closeback(false);
            }
        });
    } else {
        typeof message == 'function' && message(true);

        removeDefaultListeners();
        api.closeWin({
            animation: {
                type: "movein",
                subType: "from_left",
                duration: 100
            }
        });
    }
}
