const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 8000;

let recoveryDATA = [];
let usernameLIST = ["DS2", "ds2"];
let passwordLIST = ["cgsgforever", "CGSGFOREVER"];

app.use(express.static('dist'))

io.on('connection', (socket) => {
    console.log(`a user connected: ${socket.id}`);

    /* Send message callback */
    socket.on('sendMessage', msg => {
        recoveryDATA.push({ username: socket.username, message: msg });
        io.emit('getMessage', { username: socket.username, message: msg });
    });

    /* Request data if page reloaded */
    socket.on('requesRrecovery', code => {
        if (code === "code:30" && recoveryDATA != "")
            io.emit('receiveRecovery', recoveryDATA);
    })

    /* Registration of user */
    socket.on('setUsrename', data => {
        if (usernameLIST.indexOf(data.login) > -1)
            socket.emit('loginError', data.login + ' username is taken! Try another username.');
        else {
            socket.username = data.login;
            usernameLIST.push(data.login);
            passwordLIST.push(data.password);
            socket.emit('successAuth', 'Welcome!');
        }
    })

    /* Logging in user */
    socket.on('getUsrename', data => {
        let loginInd = usernameLIST.indexOf(data.login);
        if (loginInd == -1) {
            socket.emit('loginError', data.login + ' -- no such user exist.');
        } else {
            if (passwordLIST[loginInd] != data.password) {
                socket.emit('loginError', 'wrong password');
            } else {
                socket.username = data.login;
                socket.emit('successAuth', 'Welcome!');
            }
        }
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(port, () => {
    console.log("Server listening");
})
