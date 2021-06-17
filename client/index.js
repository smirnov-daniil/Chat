import _ from 'lodash';
import * as $ from 'jquery';
import { io, Socket } from "socket.io-client"

let socket;
let chatUsename;

function set_cookie(name, value, exp_y, exp_m, exp_d) {
    let cookie_string = name + "=" + escape(value);

    if (exp_y) {
        var expires = new Date(exp_y, exp_m, exp_d);
        cookie_string += "; expires=" + expires.toGMTString();
    }
    document.cookie = cookie_string;
}

function get_cookie(name) {
    let matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : "";
}

function checkOldFriends() {
    return get_cookie('chatUser');
}

function runReact(event, callback) {
    if (event.keyCode === 13 || event.which == 13) callback();
}

function regUser() {
    let data = { login: $('#login').val(), password: $('#password').val() };
    if (data.login == "") {
        alert("Empty login");
        return;
    }
    if (data.password == "") {
        alert("Empty password");
        return;
    }
    socket.emit('setUsrename', data);
}

function logUser() {
    let data = { login: $('#login').val(), password: $('#password').val() };
    socket.emit('getUsrename', data);
}

function auth(callback, startFunc) {
    $("#greeting").remove();
    $("body").empty();
    $("body").append("<div id='log' class='login'></div>");
    $("#log").append(" <p><label for='login'>Логин:</label><input type='text' name='login' id='login' value='name_example'></p>");
    $("#login").on('keypress', (eve) => { runReact(eve, callback) });
    $("#log").append("<p><label for='password'>Пароль:</label><input type='password' name='password' id='password' value='4815162342'></p>");
    $("#password").on('keypress', (eve) => { runReact(eve, callback) });
    $("#log").append("<p class='login-submit'><button type='submit' class='login-button' id='ok'></button></p>");
    $("#ok").on('click', callback);
    $('#login').val(startFunc);

    if ($('#login').val() != "") {
        $("#password").val(get_cookie('chatPass'));
        logUser();
    }

    socket.on('loginError', response => {
        alert(response);
    });
    socket.on('successAuth', response => {
        let current_date = new Date;
        let cookie_year = current_date.getFullYear() + 1;
        let cookie_month = current_date.getMonth();
        let cookie_day = current_date.getDate();
        set_cookie("chatUser", $('#login').val(), cookie_year, cookie_month, cookie_day);
        set_cookie("chatPass", $('#password').val(), cookie_year, cookie_month, cookie_day);
        runChat();
    });
}

function runChat() {
    const sendMessage = () => {
        let msg = $("#message").val();
        if (msg == "") return;
        socket.emit('sendMessage', msg);
        $("#message").val("");
    }
    $("#log").remove();
    $("body").empty();
    $("body").append("<div id='chat'></div>");
    $("#chat").append("<div id='chatblock'></div>");
    $("#chatblock").append("<table id='msgwnd'></table>");
    $("#chat").append("<div id='send'></div>");
    $("#send").append("<input type='text' id='message'>");
    $("#message").on('keypress', (eve) => { runReact(eve, sendMessage) });
    $("#send").append("<button id='sendbutton'>&#8250;</button>");
    $("#sendbutton").on('click', sendMessage);
    socket.emit('requesRrecovery', 'code:30');
    chatUsename = checkOldFriends();

    socket.on('getMessage', msg => {
        $("#msgwnd").append(`<tr class="anim"><td class="name">${msg.username}:</td><td class="msg">${msg.message}</td></tr>`);
        document.getElementById("msgwnd").lastChild.scrollIntoView(false);
    });
    socket.on('receiveRecovery', recDATA => {
        $("#msgwnd").empty();
        for (let msg of recDATA) {
            $("#msgwnd").append(`<tr class="anim"><td class="name">${msg.username}:</td><td class="msg">${msg.message}</td></tr>`);
            document.getElementById("msgwnd").lastChild.scrollIntoView(false);
        }
    });
}

function onLoad() {
    socket = io();

    $("body").empty();
    $("body").append("<div id='greeting'></div>");
    $("#greeting").append("<button id='signup'>Sign up</button>");
    $("#greeting").append("<button id='signin'>Sign in</button>");
    $("#signup").on('click', () => { auth(regUser, () => { return ""; }) });
    $("#signin").on('click', () => { auth(logUser, checkOldFriends) });
}

$(onLoad)