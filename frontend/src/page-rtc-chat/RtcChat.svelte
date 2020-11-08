<script lang="ts">
  import io from 'socket.io-client';
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';

  import { usersList, inputText, partnerUserRef, rtcChannel, rtcConnection } from './stores';

  /** Helper function for logging. */
  function log(...messages: any[]) {
    const elem = document.createElement('code');
    elem.textContent = `${new Date().getTime()}> ${messages.join(' ')}`;
    document.querySelector('div#chat').appendChild(elem);
  }

  /** Connect to socket. */
  const socket = io('http://localhost:3000', { transports: ['websocket'] });
  socket.on('connect', () => {
    log("Whoops, hey you're connected!");
    log();
  });
  socket.on('message', (data) => {
    switch (data.type) {
      case 'login':
        log('server: you are now logged in');
        onLogin(data);
        break;
      case 'leave':
      case 'removeUser':
        log(`server: ${data.user.username} logged out`);
        onRemoveUser(data);
        break;
      case 'updateUsers':
        log(`server: ${data.user.username} logged in`);
        onUpdateUsers(data);
        break;
      case 'users':
        log(`server: ${data.users.map((user) => user.username).join()}`);
        break;
      case 'offer':
        onOffer(data);
        break;
      case 'answer':
        onAnswer(data);
        break;
      case 'candidate':
        onCandidate(data);
        break;
      default:
        log('server:', JSON.stringify(data));
    }
  });

  const configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  function onLogin(data) {
    usersList.set(data.users);

    const connection = new RTCPeerConnection(configuration);
    connection.onicecandidate = ({ candidate }) => {
      const partnerUser = get(partnerUserRef);
      if (!candidate || !partnerUser) {
        return;
      }
      log('client: send candidate to', partnerUser.username);

      socket.send({
        type: 'candidate',
        username: partnerUser.username,
        candidate,
      });
    };
    connection.ondatachannel = (event) => {
      log('data channel created');
      const channel = event.channel;
      channel.onopen = () => {
        log('data channel is open and ready to be used');
      };
      channel.onmessage = onChannelMessageReceived;
      rtcChannel.set(channel);
    };
    connection.addEventListener('icecandidateerror', (event) => {
      log('ice candidate error:', JSON.stringify(event, ['errorCode', 'errorText']));
    });
    rtcConnection.set(connection);
  }

  function onUpdateUsers(data) {
    usersList.update((users) => users.concat(data.user));
  }

  function onRemoveUser(data) {
    usersList.update((users) => users.filter((user) => user.username !== data.user.username));
  }

  async function onOffer(data) {
    log('server: got offer from', data.user.username, JSON.stringify(data.offer));
    partnerUserRef.set(data.user);

    const connection = get(rtcConnection);
    await connection.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    rtcConnection.set(connection);

    socket.send({
      type: 'answer',
      answer,
      username: data.user.username,
    });
    log('client: send answer to', data.user.username);
  }

  async function onAnswer(data) {
    log('server: got answer', JSON.stringify(data.answer));
    const connection = get(rtcConnection);
    await connection.setRemoteDescription(data.answer);
    rtcConnection.set(connection);
  }

  async function onCandidate(data) {
    log('server: got candidate from', data.user.username, ':', JSON.stringify(data.candidate));
    const connection = get(rtcConnection);
    await connection.addIceCandidate(new RTCIceCandidate(data.candidate));
    rtcConnection.set(connection);
  }

  function onChannelMessageReceived({ data }) {
    log('message:', JSON.stringify(data));
  }

  function sendChannelMessage(data) {
    const channel = get(rtcChannel);
    channel.send(data);
    rtcChannel.set(channel);
  }

  async function connectToUser(username) {
    const partnerUser = get(partnerUserRef);
    if (partnerUser) {
      partnerUserRef.set(null);
      return;
    }

    log('client: imma create a datachannel ok?');
    const connection = get(rtcConnection);
    const channel = connection.createDataChannel('messenger');
    channel.onopen = (event) => {
      log('channel: is open!');
    };
    channel.onclose = (event) => {
      log('channel: is close!');
    };
    channel.onerror = (error) => {
      log('error:', error);
    };
    channel.onmessage = onChannelMessageReceived;
    rtcChannel.set(channel);

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    rtcConnection.set(connection);

    socket.send({
      type: 'offer',
      offer,
      username: username,
    });
  }

  /** Binded to input text box. */
  let inputElem: HTMLInputElement;

  /** Setup on component mount. */
  onMount(() => {
    inputElem.focus();
  });

  /** Setup on component unmount. */
  onDestroy(() => {
    socket.close();
  });

  /** History trackers. */
  let history = [];
  let historyCursor = 0;

  /** Handle key presses in input text box. */
  function handleInputKeydown(event: any) {
    // Templates.
    if (event.altKey) {
      switch (event.code) {
        case 'Digit1':
          const rnum = Math.floor(Math.random() * 100);
          inputText.set(`{ "type": "login", "username": "Nats ${rnum}" }`);
          break;
        case 'Digit2':
          inputText.set(`{ "type": "logout" }`);
          break;
        case 'Digit3':
          inputText.set('{ "type": "users" }');
          break;
      }
      return;
    }
    if (event.shiftKey) {
      switch (event.code) {
        case 'Enter':
          inputText.update((value) => value + '\n');
          return;
      }
    }

    // History.
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      if (event.code === 'ArrowUp') {
        historyCursor = Math.min(historyCursor + 1, history.length - 1);
      } else {
        historyCursor = Math.max(historyCursor - 1, 0);
      }
      inputText.set(history[history.length - historyCursor - 1] || '');
      return;
    }

    // Enter.
    if (event.code !== 'Enter') {
      return;
    }

    historyCursor = 0;

    // If all else is ok, we send the message to the server.
    const value: string = event.target.value;
    if (!value.startsWith('{')) {
      sendChannelMessage(value);
      log('you:', value);
      history.push(value);
      inputText.set('');
      inputElem.value = '';
      return;
    }

    try {
      socket.send(JSON.parse(value));
      log(value);
      history.push(value);
      inputText.set('');
    } catch (error) {
      log('error:', error);
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  (async () => {
    await sleep(2000);
    handleInputKeydown({
      altKey: true,
      code: 'Digit1',
    });
    await sleep(200);
    handleInputKeydown({
      code: 'Enter',
      target: {
        value: get(inputText),
      },
    });
  })();
</script>

<style lang="scss">
  .chat-input {
    width: 30em;
  }
</style>

<div class="chat-container">
  <div id="chat" class="d-flex flex-column mr-auto" />
  <input
    type="text"
    class="chat-input"
    value={$inputText}
    bind:this={inputElem}
    on:keydown={(e) => handleInputKeydown(e)} />
  <div class="users-list">
    Users:
    {#each $usersList as user}
      <button class="btn" on:click={() => connectToUser(user.username)}>{user.username}</button>
    {/each}
  </div>
</div>
