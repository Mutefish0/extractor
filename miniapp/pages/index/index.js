//index.js
//获取应用实例
const app = getApp();

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    origin: app.globalData.env.origin,
  },

  //事件处理函数
  bindViewTap: function () {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },

  onLoad: function () {
    wx.hideTabBar();
  },

  bindWebviewLoad() {
    wx.switchTab({ url: '/pages/relay/index' });
  },

  onShow() { }
})
