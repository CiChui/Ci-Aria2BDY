// ==UserScript==
// @name         Ci-Aria2百度云盘增强版
// @namespace    https://github.com/CiChui/Ci-Aria2BDY/
// @version      1.2.2
// @description  百度网盘文件直链提取, 支持一键发送至Aria2进行下载,支持路由器远程下载，支持NAS设备远程下载
// @author       CiChui
// @license      MIT
// @supportURL   https://github.com/CiChui/Ci-Aria2BDY/issues
// @date         04/11/2018
// @modified     06/06/2018
// @match        *://pan.baidu.com/disk/home*
// @match        *://yun.baidu.com/disk/home*
// @match        *://pan.baidu.com/s/*
// @match        *://yun.baidu.com/s/*
// @match        *://pan.baidu.com/share/link?*
// @match        *://yun.baidu.com/share/link?*
// @match        *://eyun.baidu.com/s/*
// @match        *://eyun.baidu.com/enterprise/*
// @match        *://aria2.me/webui-aria2/*
// @match        *://aria2.me/aria-ng/*
// @run-at       document-end
// @grant        unsafeWindow
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @require      https://cdn.bootcss.com/jquery/1.7.1/jquery.min.js
// @require      https://cdn.bootcss.com/clipboard.js/1.5.16/clipboard.min.js
// @require      https://cdn.bootcss.com/jquery-cookie/1.4.1/jquery.cookie.min.js
// @require      https://cdn.bootcss.com/Base64/1.0.1/base64.min.js
// ==/UserScript==

(function(require, define, Promise) {
    'use strict';
    //获取URL参数
    var request = function (name,encode) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null){
            if (encode == "unescape") {
                return unescape(r[2]);
            }
            return decodeURI(r[2],unescape);
        }
        return null;
    };
    var rpc = request("rpc");
    rpc = window.atob(rpc||"");
    if(window.location.host == "aria2.me" && rpc)
    {
        // var keys = {
        //     glutton:{type:'localstorage',key:'glutton_server_history',value:rpc},
        //     webuiAria:{type:'cookie',key:'aria2conf',value:rpc}
        // };
        if(window.location.href.indexOf("webui-aria2")>0)
        {
            $.cookie("aria2conf",rpc);
            window.location.href = "/webui-aria2";
        }
        else if(window.location.href.indexOf("aria-ng")>0){
            localStorage.setItem("AriaNg.Options", rpc);
            window.location.href = "/aria-ng";
        }
        return;
    }
    unsafeWindow.api = function(data, callback) {
        var ctx = require('system-core:context/context.js').instanceForSystem;
        if (data === undefined) data = new Object();
        var aria2addr = window.localStorage ? localStorage.getItem("aria2addr") : Cookie.read("aria2addr");
        if (!aria2addr) {
            aria2addr = "127.0.0.1";
            if (window.localStorage) {
                localStorage.setItem("aria2addr", aria2addr);
            } else {
                Cookie.write("aria2addr", aria2addr);
            }
        }
        else if(aria2addr.indexOf("http://") == -1 && aria2addr.indexOf("https://") == -1){
            aria2addr = "http://" + aria2addr;
        }
        var aria2port = window.localStorage ? localStorage.getItem("aria2port") : Cookie.read("aria2port");
        if (!aria2port) {
            aria2port = "6800";
            if (window.localStorage) {
                localStorage.setItem("aria2port", aria2port);
            } else {
                Cookie.write("aria2port", aria2port);
            }
        }
        var aria2rpc = window.localStorage ? localStorage.getItem("aria2rpc") : Cookie.read("aria2rpc");
        if (!aria2rpc) {
            aria2rpc = "jsonrpc";
            if (window.localStorage) {
                localStorage.setItem("aria2rpc", aria2rpc);
            } else {
                Cookie.write("aria2rpc", aria2rpc);
            }
        }
        var aria2token  = window.localStorage ? localStorage.getItem("aria2token") : Cookie.read("aria2token");
        if(!aria2token){
            aria2token = "";
            if (window.localStorage) {
                localStorage.setItem("aria2token", aria2token);
            } else {
                Cookie.write("aria2token", aria2token);
            }
        }
        aria2token = "token:"+aria2token;
        //$(data.params).unshift(aria2token);
        data.params.splice(0,0,aria2token);
        ctx.ui.tip({ mode: 'success', msg: '正在发送任务到' + aria2addr + ':' + aria2port + '/' + aria2rpc });
        GM_xmlhttpRequest({
            url: aria2addr + ':' + aria2port + '/' + aria2rpc,
            method: 'POST',
            data: JSON.stringify(data),
            dataType: 'json',
            success: function(ret) {
                ctx.ui.tip({ mode: 'success', msg: 'Ci-Aria2BDY: Aria2请求发送成功！' });
                callback(ret);
            },
            error: function(ret) {
                console.error(ret);
                ctx.ui.tip({ mode: 'caution', msg: 'Ci-Aria2BDY: 内部错误，请刷新页面, 若无效需重启Aria2', autoClose: false, hasClose: true });
            },
            timeout: function(ret) {
                console.error("request timeout");
                ctx.ui.tip({ mode: 'caution', msg: 'Ci-Aria2BDY: 请求超时，请重启Aria2', autoClose: false, hasClose: true });
            }
        });
    };
    unsafeWindow.aria2down = function(urls, filename) {
        //alert(urls);
        urls = urls.split('|');
        filename = filename.split('|');
        //var thsize = thread;
        for (var i in urls) {
            var url = urls[i];
            var output = filename[i];
            var parts = url.split('\t');
            console.log(parts);
            if (parts.length > 1) {
                url = parts[0];
                output = parts[1];
            }
            var ids = Math.round(Math.random()*10000000);
            var options = {
                params: [
                    [
                        url
                    ],
                    {
                        out: output
                    }
                ],
                jsonrpc: "2.0",
                id: ids,
                method: "aria2.addUri"
            };
            api(options,
                function() {
                setTimeout(refresh, 1000);
            });
        }
    };
    function showError(msg) {
        GM_addStyle('#errorDialog{position: fixed;top: 76.5px; bottom: auto; left: 423px; right: auto;background: #fff;border: 1px solid #ced1d9;border-radius: 4px;box-shadow: 0 0 3px #ced1d9;color: black;word-break: break-all;display: block;width: 520px;padding: 10px 20px;z-index: 9999;}#errorDialog h3{border-bottom: 1px solid #ced1d9;font-size: 1.5em;font-weight: bold;}');
        var $;
        try {
            $ = require('base:widget/libs/jquerypacket.js');
        } catch (e) {
            var div = document.createElement('div');
            $ = function(str) {
                div.innerHTML = str;
                div.onclick = function() { this.remove(); };
                return $;
            };
            $.on = function() {
                return { appendTo: function() { document.body.appendChild(div); } };
            };
        }
        var $dialog = $('<div id="errorDialog">' +
                        '<h3>Ci-Aria2BDY:程序异常</h3>' +
                        '<div class="dialog-body"><p>请尝试更新脚本或复制以下信息<a href="https://github.com/CiChui/Ci-Aria2BDY/issues" target="_blank">提交issue</a></p>' +
                        '<p>Exception: ' + msg + '</p>' +
                        '<p>Script Ver: ' + GM_info.script.version + '</p>' +
                        '<p>TemperMonkey Ver: ' + GM_info.version + '</p>' +
                        '<p>UA: ' + navigator.userAgent + '</p>' +
                        '</div><hr><a class="close" href="javascript:;">关闭</a></div>');
        $dialog.on('click', '.close', function(event) {
            $dialog.remove();
        }).appendTo(document.body);
    }
    define('Ci-Aria2BDY:pageInfo', function(require) {
        var url = location.href;
        var currentPage = 'pan';
        var matchs = {
            '.*://pan.baidu.com/disk/home.*': 'pan',
            '.*://yun.baidu.com/disk/home.*': 'pan',
            '.*://pan.baidu.com/s/.*': 'share',
            '.*://yun.baidu.com/s/.*': 'share',
            '.*://pan.baidu.com/share/link?.*': 'share',
            '.*://yun.baidu.com/share/link?.*': 'share',
            '.*://eyun.baidu.com/s/.*': 'enterprise',
            '.*://eyun.baidu.com/enterprise/.*': 'enterprise'
        };
        var PAGE_CONFIG = {
            pan: {
                prefix: 'function-widget-1:',
                containers: ['.g-button:has(.icon-download):visible'],
                style: function() {
                }
            },
            share: {
                prefix: 'function-widget-1:',
                containers: [
                    '.KKtwaH .x-button-box>.g-button:has(.icon-download)',
                    '.module-share-top-bar .x-button-box>.g-button:has(.icon-download)'
                ],
                style: function() {
                    var styleList = [
                        '.KPDwCE .QxJxtg{z-index: 2;}',
                        '.module-share-header .slide-show-right{width: auto;}',
                        '.Ci-Aria2BDY-dropdown-button.g-dropdown-button.button-open .menu{z-index:41;}',
                        '.module-share-header .slide-show-header h2{width:230px;}',
                        '.KPDwCE .xGLMIab .g-dropdown-button.Ci-Aria2BDY-dropdown-button{margin: 0 5px;}'
                    ];
                    GM_addStyle(styleList.join(''));
                }
            },
            enterprise: {
                prefix: 'business-function:',
                containers: ['.button-box-container>.g-button:has(:contains("下载"))'],
                style: function() {
                    var styleList = [
                        '.Ci-Aria2BDY-dropdown-button .icon-download{background-image: url(/box-static/business-function/infos/icons_z.png?t=1476004014313);}',
                        '.Ci-Aria2BDY-dropdown-button .g-button:hover .icon-download{background-position: 0px -34px;}'
                    ];
                    GM_addStyle(styleList.join(''));
                }
            }
        };
        for (var match in matchs) {
            if (new RegExp(match).test(url) === true) {
                currentPage = matchs[match];
            }
        }
        return PAGE_CONFIG[currentPage];
    });

    define('Ci-Aria2BDY:downloadBtnInit', function(require) {
        var ctx = require('system-core:context/context.js').instanceForSystem;
        var $ = require('base:widget/libs/jquerypacket.js');
        var pageInfo = require('Ci-Aria2BDY:pageInfo');
        var prefix = pageInfo.prefix;
        var dServ = null;
        require.async(prefix + 'download/service/dlinkService.js', function(dlinkService) {
            dServ = dlinkService;
        });

        var menu = [{
            title: 'CiAria2-下载',
            'click': function() {
                var fetchDownLinks = require('Ci-Aria2BDY:fetchDownLinks.js');
                fetchDownLinks.start(ctx, dServ);
            },
            availableProduct: ['pan', 'share', 'enterprise']
        }, {
            title: 'CiAria2-压缩下载',
            'click': function() {
                var fetchDownLinks = require('Ci-Aria2BDY:fetchDownLinks.js');
                fetchDownLinks.start(ctx, dServ, true);
            },
            availableProduct: ['pan', 'share', 'enterprise']
        },{
            title: 'CiAria2-下载设置',
            'click': function() {
                var clipboard = new Clipboard('.btn');
                clipboard.on('success',
                             function(e) {
                    dialog.hide();
                });
                clipboard.on('error',
                             function(e) {
                    dialog.hide();
                });
                var aria2addr = window.localStorage ? localStorage.getItem("aria2addr") : Cookie.read("aria2addr");
                //alert(aria2addr);
                if (!aria2addr) {
                    aria2addr = "127.0.0.1";
                }
                //alert(aria2addr);
                var aria2port = window.localStorage ? localStorage.getItem("aria2port") : Cookie.read("aria2port");
                if (!aria2port) {
                    aria2port = "6800";
                }
                var aria2rpc = window.localStorage ? localStorage.getItem("aria2rpc") : Cookie.read("aria2rpc");
                if (!aria2rpc) {
                    aria2rpc = "jsonrpc";
                }
                var aria2token = window.localStorage ? localStorage.getItem("aria2token") : Cookie.read("aria2token");
                if (!aria2token) {
                    aria2token = "";
                }
                var uitype = window.localStorage ? localStorage.getItem("uitype") : Cookie.read("uitype");
                if (!uitype) {
                    uitype = "http://aria2.me/aria-ng?rpc=";
                }
                var str=uitype.match(/([^\/]*\/){3}([^\/]*)/)[2];
                str = str.substring(0,str.indexOf('?')).replace("-","");
                var text = '<label for="txt">Aria2服务器地址: </label><input type="text" id="aria2addr" placeholder="SSL请地址前加https://" style="white-space: nowrap;" value="' + aria2addr + '" /><br><br><label for="txt">Aria2服务器端口: </label><input type="text" id="aria2port" style="white-space: nowrap;" value="' + aria2port + '" /><br><br><label for="txt">Aria2-RPC接口名: </label><input type="text" id="aria2rpc" style="white-space: nowrap;" value="' + aria2rpc + '" /><br><br><label for="txt">Aria2服务器令牌: </label><input type="text" id="aria2token" style="white-space: nowrap;" value="' + aria2token + '" /><br><br>'+
                    '<label for="txt">Aria2下载管理器:</label>'+
                    '<select id="uitype" style="width:135px;">'+
                    '<option '+(str == "webuiaria2"?"selected":"")+' value="http://aria2.me/webui-aria2?rpc=" id="WebUI-Aria2">WebUI-Aria2</option>'+
                    '<option '+(str == "ariang"?"selected":"")+' value="http://aria2.me/aria-ng?rpc=" id="Aria-NG">Aria-NG</option>'+
                    '</select>';
                var dialog = ctx.ui.confirm({
                    title: 'CiAria2-下载设置',
                    body: text,
                    sureText: '保存设置',
                    onClose: function() {
                        //clipboard && clipboard.destory && clipboard.destroy();
                    }
                });
                console.log(dialog);
                dialog.buttonIns[0].dom.attr({
                    'href': 'javascript:'+
                    'var aria2addr = document.getElementById("aria2addr").value;'+
                    'var aria2port = document.getElementById("aria2port").value;'+
                    'var aria2rpc = document.getElementById("aria2rpc").value;'+
                    'var aria2token = document.getElementById("aria2token").value || "";'+
                    'var uitype = document.getElementById("uitype").value;'+
                    'var jsonrpc=\'{"host":"\' + aria2addr.replace("https://", "").replace("http://", "") + \'","path":"/\' + aria2rpc + \'","port":\' + aria2port + \',"encrypt":\' + (aria2addr.indexOf("https://") >= 0) + \',"auth":{"token":"\' + aria2token + \'"},"directURL":""}\';'+
                    //'if(document.getElementById("uitype").options[document.getElementById("uitype").options.selectedIndex].text=="Aria2-WebUI")'+
                    'if(document.getElementById("uitype").options[document.getElementById("uitype").options.selectedIndex].text=="Aria-NG")'+
                        'jsonrpc = \'{"language":"zh_CN","title":"${downspeed}, ${upspeed} - ${title}","titleRefreshInterval":5000,"browserNotification":false,"rpcAlias":"Ci-Aria2BDY","rpcHost":"\'+JSON.parse(jsonrpc).host+\'","rpcPort":"\'+JSON.parse(jsonrpc).port+\'","rpcInterface":"jsonrpc","protocol":"\'+(JSON.parse(jsonrpc).encrypt?\'https\':\'http\')+\'","httpMethod":"POST","secret":"\'+window.btoa(JSON.parse(jsonrpc).auth.token)+\'","extendRpcServers":[],"globalStatRefreshInterval":1000,"downloadTaskRefreshInterval":1000,"afterCreatingNewTask":"task-list"}\';'+
                    //'else if(){}'+
                    'if (window.localStorage) {'+
                    'localStorage.setItem("aria2addr", aria2addr);'+
                    'localStorage.setItem("aria2port", aria2port);'+
                    'localStorage.setItem("aria2rpc", aria2rpc);'+
                    'localStorage.setItem("aria2token", aria2token);'+
                    'localStorage.setItem("uitype", uitype);'+
                    'localStorage.setItem(uitype, jsonrpc);'+
                    '}else{'+
                    'Cookie.write("aria2addr", aria2addr);'+
                    'Cookie.write("aria2port", aria2port);'+
                    'Cookie.write("aria2rpc", aria2rpc);'+
                    'Cookie.write("aria2token", aria2token);'+
                    'Cookie.write("uitype", uitype);'+
                    'Cookie.write(uitype, jsonrpc);'+
                    '}',
                    'data-clipboard-action': 'copy',
                    'data-clipboard-target': '#aria2addr'
                }).addClass('btn').off();
            },
            availableProduct: ['pan', 'share', 'enterprise']
        },{
            title: 'CiAria2-下载管理',
            'click': function() {
                var uitype=localStorage.getItem("uitype"),address=localStorage.getItem("uitype")+window.btoa(uitype);
                if(uitype && address){
                window.open(uitype+window.btoa(localStorage.getItem(uitype)));}
                else{
                    ctx.ui.tip({ mode: 'caution', msg: '请确认下载设置！'});
                }
            },
            availableProduct: ['pan', 'share', 'enterprise']
        }
                   ];

        var exDlBtnConfig = {
            type: 'dropdown',
            title: 'CiAria2-下载',
            resize: true,
            menu: menu.filter(function (btn) {
                var currentProduct = ctx.pageInfo.currentProduct;
                return ~btn.availableProduct.indexOf(currentProduct);
            }),
            icon: 'icon-download'
        };
        var selector = pageInfo.containers.join();
        $(selector).each(function(i, e) {
            var exDlBtn = ctx.ui.button(exDlBtnConfig);
            $(e).after(exDlBtn.dom.addClass('Ci-Aria2BDY-dropdown-button'));
            exDlBtn.resizeButtonWidth();
        });
        pageInfo.style();
    });

    define('Ci-Aria2BDY:fetchDownLinks.js', function (require, exports, module) {
        var $ = require('base:widget/libs/jquerypacket.js');

        function start(ctx, dServ, allZip) {
            var selectedList = ctx.list.getSelected();
            if (selectedList.length === 0) return ctx.ui.tip({ mode: 'caution', msg: '您还没有选择下载的文件' });
            ctx.ui.tip({ mode: 'loading', msg: '开始请求链接...' });

            var foldersList = selectedList.filter(function(e) {
                return e.isdir === 1;
            });
            var filesList = selectedList.filter(function(e) {
                return e.isdir === 0;
            });

            var currentProduct = ctx.pageInfo.currentProduct;

            if (!~['pan', 'share', 'enterprise'].indexOf(currentProduct)) {
                return ctx.ui.tip({ mode: 'caution', msg: '获取链接在当前页面不可用', hasClose: true, autoClose: false });
            }

            if (filesList.length > 0 && currentProduct !== 'enterprise' && !allZip) {
                foldersList.unshift(filesList);
            } else {
                [].push.apply(foldersList, filesList);
            }

            var requestMethod;
            if (currentProduct === 'pan') {
                requestMethod = function(e, cb) {
                    dServ.getDlinkPan(dServ.getFsidListData(e), allZip ? 'batch' : e.isdir === 1 ? 'batch' : 'nolimit', cb, undefined, undefined, 'POST');
                };
            } else if (currentProduct === 'share') {
                var yunData = require('disk-share:widget/data/yunData.js').get();
                requestMethod = function(e, cb) {
                    dServ.getDlinkShare({
                        share_id: yunData.shareid,
                        share_uk: yunData.uk,
                        sign: yunData.sign,
                        timestamp: yunData.timestamp,
                        list: e,
                        type: allZip ? 'batch' : e.isdir === 1 ? 'batch' : 'nolimit'
                    }, cb);
                };
            } else {
                var yunData = require('page-common:widget/data/yunData.js').get();
                requestMethod = function(e, cb) {
                    dServ.getDlinkShare({
                        share_id: yunData.shareid,
                        share_uk: yunData.uk,
                        sign: yunData.sign,
                        timestamp: yunData.timestamp,
                        list: [e],
                        isForBatch: allZip
                    }, cb);
                };
            }
            var timeout = foldersList.length === 1 ? 3e4 : 3e3;
            var promises = foldersList.map(function(e) {
                return new Promise(function(resolve, reject) {
                    var timer = setTimeout(function() {
                        resolve($.extend({}, e));
                    }, timeout);
                    requestMethod(e, function(result) {
                        resolve($.extend({}, e, result));
                    });
                });
            });
            Promise.all(promises).then(function(result) {
                ctx.ui.hideTip();
                var dlinks = [];
                var needToRetry = result.filter(function(e) {
                    return e.errno !== 0;
                });
                if (needToRetry.length > 0) {
                    try {
                        dServ.dialog.hide();
                    } catch (ex) {}
                    ctx.ui.tip({
                        mode: 'caution',
                        msg: needToRetry.length + '个文件请求链接失败'
                    });
                }
                result.filter(function(e) {
                    return e.errno === 0;
                }).forEach(function(e) {
                    if (typeof e.dlink === 'string') {
                        var dlink = e.dlink + "&zipname=" + encodeURIComponent((e.isdir ? '【文件夹】' : '【文件】') + e.server_filename + '.zip');
                        dlinks.push(e.dlink && dlink);
                    } else {
                        [].push.apply(dlinks, (e.dlink || e.list || []).map(function(e) {
                            return e.dlink;
                        }));
                    }
                });
                if (dlinks.length === 0) return ctx.ui.tip({ mode: 'caution', msg: '失败：未获取到链接' });
                var clipboard = new Clipboard('.btn');
                clipboard.on('success', function(e) {
                    ctx.ui.tip({ mode: 'success', msg: '成功' + dlinks.length + '个文件' });
                    e.clearSelection();
                    dialog.hide();
                    clipboard.destroy();
                });
                clipboard.on('error', function(e) {
                    ctx.ui.tip({ mode: 'caution', msg: '失败' });
                });
                var urlnow = location.href;
                if(urlnow.indexOf('pan.baidu.com/disk/home') > 0 ){
                    ctx.ui.alert('<p style="font-size:16px;">Ci-Aria2BDY：由于百度云文件解析策略调整<br>请使用"分享"功能将需要下载的文件进行分享<br>再前往分享链接界面导出下载</p>');
                    return false;
                } else if(urlnow.indexOf('yun.baidu.com/disk/home') > 0 ) {
                    ctx.ui.alert('<p style="font-size:16px;">Ci-Aria2BDY：由于百度云文件解析策略调整<br>请使用"分享"功能将需要下载的文件进行分享<br>再前往分享链接界面导出下载</p>');
                    return false;
                } else if(urlnow.indexOf('eyun.baidu.com/enterprise') > 0 ) {
                    ctx.ui.alert('<p style="font-size:16px;">Ci-Aria2BDY：由于百度云文件解析策略调整<br>请使用"分享"功能将需要下载的文件进行分享<br>再前往分享链接界面导出下载</p>');
                    return false;
                }
                var showurls = dlinks.join('\n');
                //var showurls = showurlss.replace(/d.pcs.baidu.com/g, 'pcs.baidu.com');
                var text = '<textarea id="bar" rows="' + ((dlinks.length > 20 ? 20 : dlinks.length) + 1) + '" style="width:100%;white-space: nowrap;">' + showurls + '</textarea>';
                var filenames;
                var foldersList = selectedList.filter(function(e) {
                    return e.isdir === 1;
                });
                var filesList = selectedList.filter(function(e) {
                    return e.isdir === 0;
                });
                result.filter(function(e) {
                    return e.errno === 0;
                }).forEach(function(e) {
                    if (e.isdir === 1) {
                        //alert('isdir');
                        var filenamearr = [];
                        //alert('nodir');
                        for (var i = 0; i < foldersList.length; i++) {
                            var fname = foldersList[i]['server_filename'];
                            var ffname = fname.replace(/|/g, '');
                            var fffname = ('【文件夹】' + ffname + '.zip');
                            filenamearr.push(fffname);
                        }
                        filenames = filenamearr.join('|');
                    } else {
                        var filenamearr = [];
                        for (var i = 0; i < filesList.length; i++) {
                            var fname = filesList[i]['server_filename'];
                            var ffname = fname.replace(/|/g, '');
                            filenamearr.push(ffname);
                        }
                        filenames = filenamearr.join('|');
                    }
                });
                //alert(filenames);
                var urls = dlinks.join('|');
                //var urls = urlss.replace(/d.pcs.baidu.com/g, 'pcs.baidu.com');
                //alert(urls);
                var dialog = ctx.ui.confirm({
                    title: 'Aria2下载',
                    body: text,
                    sureText: '发送到Aria2下载',
                    onClose: function() {
                        //clipboard && clipboard.destory && clipboard.destroy();
                    }
                });
                dialog.buttonIns[0].dom.attr({
                    'href': "javascript:window.aria2down('" + urls + "', '" + filenames + "');",
                    'data-clipboard-action': 'copy',
                    'data-clipboard-target': '#bar'
                }).addClass('btn').off();
                dialog.buttonIns[1].dom[0].href = "javascript:window.open('" + urls + "', '" + filenames + "')";
                dialog.buttonIns[1].dom[0].innerHTML='<span class="g-button-right" style="padding-right: 50px;"><span class="text" style="width: auto;">立即下载</span></span>';
            }).catch(function(e) {
                showError(e);
            });
        };
        module.exports = {
            start: start
        };
    });

    define('Ci-Aria2BDY:pluginInit.js', function(require) {
        var ctx = require('system-core:context/context.js').instanceForSystem;
        var $ = require('base:widget/libs/jquerypacket.js');
        var pageInfo = require('Ci-Aria2BDY:pageInfo');
        var prefix = pageInfo.prefix;
        require.async(prefix + 'download/util/context.js', function(e) {
            e.getContext = function() {
                return ctx;
            };
        });
        var dmPromise = new Promise(function(resolve, reject) {
            $(unsafeWindow).on('load', function() {
                reject('downloadManager.js');
            });

			resolve();
            require.async(prefix + 'download/service/downloadManager.js', function(dm) {
                dm.MODE_PRE_INSTALL = dm.MODE_PRE_DOWNLOAD;
                resolve();
            });
        });
        var gjcPromise = new Promise(function(resolve, reject) {
            $(unsafeWindow).on('load', function() {
                reject('guanjiaConnector.js');
            });
            require.async(prefix + 'download/service/guanjiaConnector.js', function(gjC) {
                gjC.init = function() {
                    setTimeout(function() {
                        ctx.ui.tip({ mode: 'caution', msg: '检测到正在调用云管家，若脚本失效，请检查更新或提交issue', hasClose: true, autoClose: false });
                    }, 5e3);
                };
                resolve();
            });
        });
        var ddsPromise = new Promise(function(resolve, reject) {
            $(unsafeWindow).on('load', function() {
                reject('downloadDirectService.js');
            });
			resolve();
            /*require.async(prefix + 'download/service/downloadDirectService.js', function(dDS) {
                var $preDlFrame = null;
                var _ = dDS.straightforwardDownload;
                if (typeof _ !== 'function') return;
                dDS.straightforwardDownload = function() {
                    ctx.ui.tip({ mode: 'loading', msg: '正在开始下载...' });
                    if ($preDlFrame === null) {
                        setTimeout(function() {
                            var $frame = $('#pcsdownloadiframe');
                            if ($frame.length === 0) return;
                            $frame.ready(function(event) { ctx.ui.hideTip(); });
                            $preDlFrame = $frame;
                        }, 1e3);
                    }
                    _.apply(dDS, arguments);
                };
                resolve();
            });*/
        });
        Promise.all([dmPromise, gjcPromise, ddsPromise]).then(function() {
            try {
                require('Ci-Aria2BDY:downloadBtnInit');
                ctx.ui.tip({ mode: 'success', msg: 'Ci-Aria2BDY: 插件加载成功' });
            } catch (e) {
                ctx.ui.tip({ mode: 'caution', msg: 'Ci-Aria2BDY: 插件加载成功，按钮初始化失败', autoClose: false, hasClose: true });
            }
        }).catch(function(msg) {
            if(document.querySelector('#share_nofound_des') !== null) return;
            showError(msg + '加载失败');
        });
    });
    try {
        require('Ci-Aria2BDY:pluginInit.js');
    } catch (ex) { showError(ex); }
})(unsafeWindow.require, unsafeWindow.define, unsafeWindow.Promise);
