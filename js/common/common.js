/*************************************************************************/
/****************************** 全局变量区 开始  *********************************/
/*************************************************************************/

/******************** 定义服务器环境变量 开始********************/
//生产环境
//var common_url = 'http://www.mlinf.com/app/';
//var oss_url = 'http://img.mlinf.com/';


// 测试环境
//var common_url = 'http://test.mlinf.com:8090/app/';
//var common_url = "http://test.mlinf.com/app/";
//var oss_url = "http://imgtest.mlinf.com/";

// 开发测试
//var common_url = "http://test.mlinf.com/app/";
//var oss_url = "http://imgtest.mlinf.com/";

//对外测试环境
//var common_url = 'http://test.mlinf.com:8080/app/';

//个人服务器
var common_url = 'http://192.168.0.124:8080/app/';
var oss_url = "http://imgtest.mlinf.com/";
/******************** 定义服务器环境变量 结束********************/

// 定义美邻服务器请求key
var meilin_header_key = "merchantAPP";
//var meilin_header_key = "meilinAPP";

// OSS图片样式变量
var img_original_style = "";
var img_middel_style = "@100w_100h_100sh_300p.png";
var img_small_style = "@60w_60h.png";


/*************************************************************************/
/****************************** APP操作开始  *********************************/
/*************************************************************************/

function isIOS() {
    return api.systemType == 'ios';
}

//网络链接检测
function offAndOnline(online, offline) {
    var online = true;
    api.addEventListener({
        name: 'online'
    }, function (ret, err) {
        if (!online) {
            online = true;
            api.toast({msg: ret.connectionType + "网络已连接", duration: 3000});
        }
    });
    api.addEventListener({
        name: 'offline'
    }, function (ret, err) {
        offline && offline();
        if (ret.connectionType == 'none') {
            online = false;
            api.toast({msg: "网络已断开", duration: 3000});
        }
    });
}

/**
 * 检查是否有网络
 * @return 如果有网络信号，则返回true；否则返回false。
 */
function checkNetwork() {
    return api.connectionType != 'none';
}

// 上线为false，下线为true
var checkOffline = (function () {
    var online = true;
    return function (dom) {
        if (!checkNetwork()) {
            online = false;
            if (dom) {
                noNetwork(dom);
            }
            return true;
        }
        if (!online) {
            hasNetwork();
            online = true;
        }
        return false;
    };
})();

//双击返回键 退出APP
function exitApp() {
    api.addEventListener({
        name: 'keyback'
    }, function (ret, err) {
        api.toast({
            msg: '再按一次返回键退出' + api.appName,
            duration: 2000,
            location: 'bottom'
        });
        api.addEventListener({
            name: 'keyback'
        }, function (ret, err) {
            api.closeWidget({
                id: api.appId,
                retData: {name: 'closeWidget'},
                silent: true
            });
        });
        setTimeout(function () {
            exitApp();
        }, 3000)
    });
}

/** 停止推逿**/
function stopPush() {
    api.sendEvent({
        name: 'stopPush',
        extra: {}
    });
}

/** 异步缓存图片 **/
function cacheImages(url, afterCached) {
    api.imageCache({
        url: oss_url + url,
        policy: "cache_else_network",
        thumbnail: false
    }, function (ret, err) {
        if (ret) {
            afterCached(ret.url);
        }
    });
}

/**
 * 检查是否登录,如果没有登录将跳到登录页面
 * @return 如果已经登录，则返回true；否则返回false。
 */
function checkLogined() {
    if (!getStorage("user.isLogin")) {
        openWin("login");
        return false;
    } else {
        return true;
    }
}


function defaultImg(dom, type) {
    dom.src = "../image/headerDefault.png"
    //dom.onerror = null;
}

function loadCSS(path) {
    var style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = path;
    document.getElementsByTagName('head')[0].appendChild(style);
}

function loadJS(path) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = path;
    document.getElementsByTagName('head')[0].appendChild(script);
}

/*************************************************************************/
/****************************** 页面操作开始  *********************************/
/*************************************************************************/

/**
 *     页面加载完毕
 * @param {Function} ready 可选,页面加载的时候调用
 * @param {Function} keyback 可选，点击keyback的时候调用，默认调用closeWin();
 */
function onready(ready, keyback) {
    window.apiready = function () {
        api.addEventListener({name: 'keyback'}, function (ret, err) {
            typeof keyback == 'function' ? keyback() : closeWin();
        });

        typeof ready == 'function' && ready();
    }
}

// css3加载中动画
function startLoadAnimate(after) {
    var list = '<div class="loadAnimate">'
        + '<span class="loading load">'
        + '<span class="left"><span class="anim"></span></span>'
        + '<span class="right"><span class="anim"></span></span>'
        + '</span>'
        + '<div class="dot">'
        + '<span class="ani_dot"></span>'
        + '</div>'
        + '</div>';
    append(document.getElementsByTagName('body')[0], list);
    if (after) {
        setTimeout(function () {
            closeLoadAnimate();
            api.toast({
                msg: '加载失败，请稍后重试。'
            });
        }, 5000)
    }
}

// 关闭css3加载中动画
function closeLoadAnimate(retainLoading/**保持loadingData**/) {

    var loadAnimate = getDom('.loadAnimate')
    if (!loadAnimate) return;

    var loading = getDom(".loadingData");
    if (typeof avalon != 'undefined' && avalon.ready) {
        avalon.ready(function () {
            !retainLoading && loading && css(loading, "display:block !important");
            remove(loadAnimate[0]);
        })
    } else {
        !retainLoading && loading && css(loading, "display:block !important");
        remove(loadAnimate[0]);
    }
}
//没有数据Dom
function nodata(dom) {
    var doms = getDom(".NoData");
    if (!doms || doms.length <= 0) {
        hasNetwork();
        append(dom, '<span class="NoData"></span>');
    }
}

// 拥有数据
function hasData() {
    var doms = getDom(".NoData");
    if (doms) {
        remove(doms[0]);
    }
}

// 没有网络
function noNetwork(dom) {
    var doms = getDom(".NoNetwork");
    if (!doms || doms.length <= 0) {
        hasData();
        append(dom, '<span class="NoNetwork"></span>');
    }
}

function hasNetwork() {
    var doms = getDom(".NoNetwork");
    if (doms) {
        remove(doms[0]);
    }
}

function newMsgBadge(dom, size, id) {
    size = size || 0;
    if (!id) {
        var badges = getDom('.badge_');
        if (badges && badges.length > 0) {
            if (size && size > 0) html(badges[0], size);
            else remove(badges[0]);
        } else if (size && size > 0) {
            after(dom, '<span class="badge badge_">' + size + '</span>');
        } else if (typeof size != 'number') {
            // size为非数字的其他值,则只需要为指定dom添加一个标识新消息的DOM
            after(dom, '<span class="redDot badge_"></span>');
        }
    } else {
        var badge = getDom('#badge_' + id);
        if (badge) {
            if (size && size > 0) html(badge, size);
            else remove(badge);
        } else if (size && size > 0) {
            after(dom, '<span id="badge_' + id + '" class="badge">' + size + '</span>');
        } else if (typeof size != 'number') {
            // size为非数字的其他值,则只需要为指定dom添加一个标识新消息的DOM
            after(dom, '<span id="badge_' + id + '" class="redDot badge_"></span>');
        }
    }
}

//双击提交判断
function enable(dom) {
    dom.disabled = false;
    css(dom, "background-color:#3ec6b8");
}
function disable(dom) {
    dom.disabled = true;
    css(dom, "background-color:#ccc");
}

/**
 * 获取用户缓存头像
 */
function getUserHead(callback) {
    cacheImages(getStorage("user.headImg") + img_small_style, function (url) {
        if (url) {
            callback(url);
        }
    });
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
            type: "movein",
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

function removeDefaultListeners() {
    api.removeEventListener({
        name: 'viewappear'
    });
    api.removeEventListener({
        name: 'keyback'
    });
}

function addDomEvt(el, name, fn, useCapture) {
    //console.log(el)
    //console.log(name)
    if (!isElement(el)) {
        //console.warn('common.addDomEvt addEvt Function need el param, el param must be DOM Element');
        return;
    }
    useCapture = useCapture || false;
    if (el.addEventListener) {
        el.addEventListener(name, fn, useCapture);
    }
}

function rmDomEvt(el, name, fn, useCapture) {
    if (!isElement(el)) {
        //console.warn('common.reDomEvt Function need el param, el param must be DOM Element');
        return;
    }
    useCapture = useCapture || false;
    if (el.removeEventListener) {
        el.removeEventListener(name, fn, useCapture);
    }
}

function fixIos7Bar(el) {
    api.setStatusBarStyle({
        style: 'light'
    });
    if (!isElement(el)) {
        console.warn('common.js fixIos7Bar Function need el param, el param must be DOM Element');
        return;
    }
    var strDM = api.systemType;
    if (strDM == 'ios') {
        var strSV = api.systemVersion;
        var numSV = parseInt(strSV, 10);
        var fullScreen = api.fullScreen;
        var iOS7StatusBarAppearance = api.iOS7StatusBarAppearance;
        if (numSV >= 7 && !fullScreen && iOS7StatusBarAppearance) {
            el.style.paddingTop = '20px';
        }
    }
}

function deleteItem(message, callDelete) {

    if (message && typeof message == 'function') {
        callDelete = message;
        message = null;
    }

    if (isEmpty(callDelete)) return;

    message = message || "你想好了要删除吗？";

    api.confirm({
        title: "提醒",
        msg: message,
        buttons: ["确定", "取消"]
    }, function (ret, err) {
        if (ret.buttonIndex == 1) {
            // 确定删除
            callDelete();
        }
    });
}

function prepend(el, html) {
    if (!isElement(el)) {
        console.warn('common.prepend Function need el param, el param must be DOM Element');
        return;
    }
    if (typeof html == 'string') {
        el.insertAdjacentHTML('afterbegin', html);
    } else {
        el.insertBefore(html, el.childNodes[0]);
    }
    return el;
}
function append(el, html) {
    if (!isElement(el)) {
        console.warn('common.append Function need el param, el param must be DOM Element');
        return;
    }
    if (typeof html == 'string') {
        el.insertAdjacentHTML('beforeend', html);
    } else {
        el.appendChild(html);
    }
    return el;
}
function after(el, html) {
    if (typeof el == 'string') {
        return after(getDom(el), html);
    }
    if (!isElement(el)) {
        console.warn('common.js.after Function need el param, el param must be DOM Element');
        return;
    }
    el.insertAdjacentHTML('afterend', html);
    return el;
}
function html(el, htmlStr) {

    if (typeof el == 'string') {
        return html(getDom(el), htmlStr);
    }

    if (!isElement(el)) {
        console.warn('common.html Function need el param, el param must be DOM Element');
        return;
    }
    if (arguments.length === 1) {
        return el.innerHTML;
    } else if (arguments.length === 2) {
        el.innerHTML = htmlStr;
        return el;
    }
}

function remove(el) {
    if (!isElement(el)) {
        console.warn('common.remove Function need el param, el param must be DOM Element');
        return;
    }
    if (el && el.parentNode) {
        el.parentNode.removeChild(el);
    }
}

// 获取dom元素
function getDom(el, selector) {
    if (arguments.length === 1 && typeof arguments[0] == 'string') {
        if (startWith(el, '#')) {
            return document.getElementById(el.substring(1));
        }
        if (startWith(el, '.')) {
            return document.getElementsByClassName(el.substring(1));
        } else if (document.querySelector) {
            return document.querySelector(arguments[0]);
        }
    } else if (arguments.length === 2) {
        if (el.querySelector) {
            return el.querySelector(selector);
        }
    }
}

// 获取dom元素的参考系
function offset(el) {

    if (typeof el == 'string') {
        return offset(getDom(el));
    }

    if (!isElement(el)) {
        console.warn('common.offset Function need el param, el param must be DOM Element');
        return;
    }
    var sl = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
    var st = Math.max(document.documentElement.scrollTop, document.body.scrollTop);

    var rect = el.getBoundingClientRect();
    return {
        l: rect.left + sl,
        t: rect.top + st,
        w: el.offsetWidth,
        h: el.offsetHeight
    };
}

function height(el) {

    if (!el) return;

    if (typeof el == 'string') return height(getDom(el));

    if (el instanceof Array) {
        var h = 0;
        for (var i = 0; i < el.length; i++) {
            var dom = el[i]
            h += height(dom);
        }
        return h;
    }

    return offset(el).h;
}

function attr(el, name, value) {

    if (typeof el == 'string') {
        return attr(getDom(el), name, value);
    }

    if (!isElement(el)) {
        console.warn('common.attr Function need el param, el param must be DOM Element');
        return;
    }
    if (arguments.length == 2) {
        return el.getAttribute(name);
    } else if (arguments.length == 3) {
        el.setAttribute(name, value);
        return el;
    }
}

function css(dom, style) {

    if (!dom || (typeof style != 'string' && style.indexOf(':') <= 0)) {
        return;
    }

    if (typeof dom == 'string') {
        return css(getDom(dom), style);
    }

    if (dom instanceof HTMLCollection || dom.length > 0) {
        for (var i = 0; i < dom.length; i++) {
            var el = dom[i];
            if (isElement(el)) {
                el.style && (el.style.cssText += ';' + style);
            }
        }
        return;
    }
    if (!isElement(dom)) {
        console.warn('common.css Function need el param, el param must be DOM Element');
        return;
    }
    if (isElement(dom)) {
        var styles = split(dom.style.cssText, ";");
        if (styles && styles.length > 0) {
            var newStyleObj = {};
            for (var i = 0; i < styles.length; i++) {
                if (!isEmpty(styles[i])) {
                    var stl = split(styles[i], ":");
                    newStyleObj[stl[0]] = stl[1];
                }
            }
            var newStyles = split(style, ";");
            for (var j = 0; j < newStyles.length; j++) {
                if (!isEmpty(newStyles[j])) {
                    var newStl = split(newStyles[j], ":");
                    newStyleObj[newStl[0]] = newStl[1];
                }
            }
            var newStyle = "";
            for (var pro in newStyleObj) {
                if (newStyleObj.hasOwnProperty(pro)) {
                    newStyle += pro + ":" + newStyleObj[pro] + ";";
                }
            }
            dom.style && (dom.style.cssText = newStyle);
        } else {
            dom.style && (dom.style.cssText += ';' + style);
        }
        return dom;
    }
}
function addCls(el, cls) {

    if (typeof el == 'string') {
        el = getDom(el);
        if (el instanceof HTMLCollection || el.length > 0) {
            for (var i = 0; i < el.length; i++) {
                addCls(el[i], cls);
            }
        } else {
            addCls(el, cls);
        }
        return;
    }

    if (!isElement(el)) {
        console.warn('common.addCls Function need el param, el param must be DOM Element');

        throw "ee";
    }
    if ('classList' in el) {
        el.classList.add(cls);
    } else {
        var preCls = el.className;
        var newCls = preCls + ' ' + cls;
        el.className = newCls;
    }
    return el;
};

function removeCls(el, cls) {

    if (typeof el == 'string') {
        el = getDom(el);
        if (el instanceof HTMLCollection || el.length > 0) {
            for (var i = 0; i < el.length; i++) {
                removeCls(el[i], cls);
            }
        } else {
            removeCls(el, cls);
        }
        return;
    }
    if (!isElement(el)) {
        console.warn('common.removeCls Function need el param, el param must be DOM Element');
        throw "ee";
    }
    if ('classList' in el) {
        el.classList.remove(cls);
    } else {
        var preCls = el.className;
        var newCls = preCls.replace(cls, '');
        el.className = newCls;
    }
    return el;
}

function children(elem) {
    if (elem) {
        return sibling(elem.firstChild);
    }
}
function sibling(n, elem) {
    var r = [];
    for (; n; n = n.nextSibling) {
        if (n.nodeType === 1 && n !== elem) {
            r.push(n);
        }
    }
    return r;
}


//判断obj是否是dom元素
function isElement(obj) {
    return !!(obj && obj.nodeType == 1);
}

//字数长度
function showLength(val, id) {
    var rem = val.length;
    var wid = id;
    if (rem < 0) {
        rem = 0;
    }
    document.getElementById(wid).innerHTML = rem;
}

/****************************************************************************/
/****************************** 数据编码解码、加密解密开始  ***************************/
/****************************************************************************/

/**
 * Created by Administrator on 2014/12/17.
 */
/**
 *
 *  Secure Hash Algorithm (SHA1)
 *  http://www.webtoolkit.info/
 *
 **/

function SHA1(msg) {

    function rotate_left(n, s) {
        var t4 = ( n << s ) | (n >>> (32 - s));
        return t4;
    };

    function lsb_hex(val) {
        var str = "";
        var i;
        var vh;
        var vl;

        for (i = 0; i <= 6; i += 2) {
            vh = (val >>> (i * 4 + 4)) & 0x0f;
            vl = (val >>> (i * 4)) & 0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    };

    function cvt_hex(val) {
        var str = "";
        var i;
        var v;

        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    };

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    msg = Utf8Encode(msg);

    var msg_len = msg.length;

    var word_array = new Array();
    for (i = 0; i < msg_len - 3; i += 4) {
        j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 |
            msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
        word_array.push(j);
    }

    switch (msg_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
            break;

        case 2:
            i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
            break;

        case 3:
            i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
            break;
    }

    word_array.push(i);

    while ((word_array.length % 16) != 14) word_array.push(0);

    word_array.push(msg_len >>> 29);
    word_array.push((msg_len << 3) & 0x0ffffffff);


    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {

        for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

    }

    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

    return temp.toLowerCase();

}

/*************************************************************************/
/****************************** http请求开始  *********************************/
/*************************************************************************/
/**
 * @param {String} url 必填，相对common_url的地址
 * @param {String} httpMethod 可选，请求方法，默认为post
 * @param {Object} bodyParam 可选，请求参数，默认为空对象{}
 * @param {Function} callBack 可选，请求结束后的回调函数
 */
function ajaxRequest(url, httpMethod, bodyParam, callBack) {

    if (typeof httpMethod != 'string') {
        if (typeof httpMethod != 'function') {
            callBack = bodyParam;
            bodyParam = httpMethod;
        } else if (typeof httpMethod == 'function') {
            callBack = httpMethod;
            bodyParam = {};
        }
        httpMethod = "post";
    }

    if (typeof bodyParam == 'function') {
        callBack = bodyParam;
        bodyParam = {};
    }

    callBack = callBack || function () {
        };

    var params = {};
    if (bodyParam && (bodyParam.files || bodyParam.values)) {
        params = bodyParam;
    } else {
        params = {
            values: bodyParam
        };
    }
    var appId = 'A6990703505579';
    var key = '130B8D7E-4815-EA8D-6356-2AFAE2963F38';
    var now = Date.now();
    var appKey = SHA1(appId + "UZ" + key + "UZ" + now) + "." + now;
    var request = {
        url: common_url + url,
        method: httpMethod,
        timeout: 3000,
        dataType: 'json',
        returnAll: false,
        headers: {
            "Access-Control-Allow-Headers": "X-Requested-With",
            "X-Requested-With": "XMLHttpRequest",
            "X-APICloud-AppId": appId,
            "X-APICloud-AppKey": appKey,
            "appkey": meilin_header_key,
            "Accept": "application/json"
        },
        data: params
    };
    if (checkOffline()) {
        return callBack(false);
    }
    api.ajax(request, function (ret, err) {
        callBack(ret, err);
    });
}

/**
 * 判断元素是否在指定的数组中
 * @param {String} filetype 上传的文件用途， 必填
 * @param {String} filepath 旧文件路径， 可选
 * @param {Boolean} showProgress 布尔值，是否显示上传的进度，默认为false不显示， 可选
 * @param {Function} callback 回调函数，可选
 */
function uploadFile(filetype, filepath, showProgress, afterUpload, beforeUpload) {

    if (typeof filepath == 'function') {
        afterUpload = filepath;
        filepath = null;
        if (typeof showProgress == 'function') {
            beforeUpload = showProgress;
            showProgress = false;
        }
    } else if (typeof filepath == 'boolean') {
        beforeUpload = afterUpload;
        afterUpload = showProgress;
        showProgress = filepath;
        filepath = null;
    }

    showProgress = showProgress || false;
    if (typeof showProgress == 'function') {
        beforeUpload = afterUpload;
        afterUpload = showProgress;
        showProgress = false;
    }

    (!afterUpload || typeof afterUpload != 'function') && (afterUpload = function () {
    });

    var iw = (api.winWidth);
    var ih = (api.winHeight);
    api.getPicture({
        sourceType: 'library',
        encodingType: 'jpg',
        mediaValue: 'pic',
        destinationType: 'url',
        allowEdit: false,
        quality: 7,
        saveToPhotoAlbum: false
    }, function (ret, err) {
        if (ret && ret.data != "") {
            beforeUpload && beforeUpload();
            showProgress && api.showProgress({title: '上传中...', modal: false});

            var param = {};
            param.values = {
                "filetype": filetype
            };
            filepath && (param.values.filepath = filepath);
            param.files = {
                file: ret.data
            }
            ajaxRequest("file/uploadFile.do", param, function (ret, err) {
                showProgress && api.hideProgress();
                afterUpload(ret, err);
            });
        }
    })
}

/**
 * 从服务器中删除文件
 * @param {String} path 被删除的文件路径(相对路径)， 必填
 * @param {Function} callback 回调函数， 可选
 */
function deleteFile(path, callback) {
    callback = callback || function () {
        };
    ajaxRequest("file/delete.do", "post", {filePath: path}, callback);
}


/*************************************************************************/
/****************************** 日期处理开始  *********************************/
/*************************************************************************/
function parseDateFromStr(unixtime) {
    var timestr = new Date(parseInt(unixtime));
    var datetime = timestr.toLocaleString().replace(/年|月/g, "-").replace(/日/g, " ");
    return datetime;
}

/*************************************************************************/
/********************************* 数组处理  *********************************/
/*************************************************************************/
/**
 * 判断元素是否在指定的数组中
 * @param {Array} array
 * @param {Object} el
 */
function inArray(array, el) {
    var isIn = false;
    if (array && array.length > 0) {
        array.map(function (a) {
            if (el == a) {
                isIn = true;
            }
        });
    }
    return isIn;
}

function cloneArray(newArr, clonedArr) {
    newArr = [];
    newArr = clonedArr;
}

/*************************************************************************/
/********************************* 字符串处理  ********************************/
/*************************************************************************/
/**
 * 判断str开头的字符串是否与regexp匹配
 * @param {String} str
 * @param {Object} regexp 正则表达式或者字符串
 * @return 如果匹配成功则返回true，否则返回false
 */
function startWith(str, regexp) {
    if (regexp instanceof RegExp) {
        return !!str.match(regexp);
    } else if (typeof regexp == 'string') {
        try {
            if (str.substring(0, regexp.length) == regexp) {
                return true;
            }
        } catch (e) {
            return false;
        }
    }
    return false;
}

/**
 * 分隔字符串，返回一个数组
 * @param {String} str
 * @param {Object} regexp 正则表达式或者字符串
 * @return 返回分隔后的数组
 */
function split(str, regexp) {
    if (str) {
        return str.split(regexp);
    }
    return [];
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


/*************************************************************************/
/*********************-********** Object对象处理  ****************************/
/*************************************************************************/
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
 * 判断两个对象是否相等
 * @param {Object} obj
 * @param {Object} compared
 * @return boolean值， true表示obj和compared相等，false表示不等
 */
function equals(obj, compared) {
    return obj == compared;
}

/**
 * 对象继承
 * @param {Object} parent
 * @param {Object} obj
 * @return obj
 */
function extend(parent, obj) {
    obj = obj || {};
    for (var pro in parent) {
        obj[pro] = obj[pro] || parent[pro];
    }
    return obj;
}

function copy(obj, template) {
    var ret = {};
    for (var prop in template) {
        if (template.hasOwnProperty(prop)) {
            ret[prop] = obj[prop];
        }
    }
    return ret;
}
/*************************************************************************/
/*****************************  去除转义字符  ******************************/
/*************************************************************************/
var excludeMeaning = function (str) {
    // 去掉转义字符
    str = str.replace(/[\'\"\\\\b\f\n\r\t]/g, '');
    return str;
};
var excludeSpecial = function (str) {
    // 去掉特殊字符
    str = str.replace(/[\@\#\$\%\^\&\*\(\)\{\}\:\"\L\<\>\?\[\]]/);
    return str;
};
//滚动到底部
function scrollBottom(){
	var bodyScrollTop,bodyScrollHeight,documentScrollTop,documentScrollHeight,windowHeight;
	if(document.body){
　　　　bodyScrollTop = document.body.scrollTop;
	bodyScrollHeight = document.body.scrollHeight;
　　}
　　if(document.documentElement){
　　　　documentScrollTop = document.documentElement.scrollTop;
	documentScrollHeight = document.documentElement.scrollHeight;
　　}
	if(document.compatMode == "CSS1Compat"){
　　　　windowHeight = document.documentElement.clientHeight;
　　}else{
　　　　windowHeight = document.body.clientHeight;
　　}
　　scrollTop = (bodyScrollTop - documentScrollTop > 0) ? bodyScrollTop : documentScrollTop;
　　scrollHeight = (bodyScrollHeight - documentScrollHeight > 0) ? bodyScrollHeight : documentScrollHeight;
	if(scrollTop +windowHeight == scrollHeight){
		return true;
	}
}
