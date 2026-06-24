const api = {
  users: () => fetch('/api/users').then(r => r.json()),
  user: username => fetch(`/api/users/${username}`).then(r => r.json()),
  posts: () => fetch('/api/posts').then(r => r.json()),
  comments: postId => fetch(`/api/posts/${postId}/comments`).then(r => r.json()),
  newPost: payload => fetch('/api/posts', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)}).then(r => r.json()),
  comment: (id,payload) => fetch(`/api/posts/${id}/comments`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)}).then(r=>r.json()),
  like: id => fetch(`/api/posts/${id}/like`, { method:'POST'}).then(r=>r.json()),
  follow: (username,payload) => fetch(`/api/users/${username}/follow`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(payload)}).then(r=>r.json())
};

const state = { users: [], currentUser: null, posts: [] };

function renderUsers(){
  const list = document.getElementById('users');
  const select = document.getElementById('current-user');
  list.innerHTML = state.users.map(u=>`<li><a href="#" data-user="${u.username}">${u.name}</a></li>`).join('');
  select.innerHTML = state.users.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
  select.value = state.currentUser?.id || state.users[0]?.id;
}

async function loadPosts(){
  state.posts = await api.posts();
  const container = document.getElementById('posts');
  container.innerHTML = await Promise.all(state.posts.map(async post=>{
    const comments = await api.comments(post.id);
    const user = post.user;
    return `
      <div class="post">
        <div class="post-meta"><strong>${user.name}</strong> • ${new Date(post.createdAt).toLocaleString()}</div>
        <p>${post.content}</p>
        <div><button data-like="${post.id}">Like (${post.likes})</button> <button data-follow="${user.username}">Follow</button></div>
        <div class="comments">${comments.map(c=>`<div class="comment"><strong>${state.users.find(u=>u.id===c.userId)?.name||'User'}</strong>: ${c.content}</div>`).join('')}</div>
        <form data-comment="${post.id}"><input type="text" name="comment" placeholder="Write a comment..." required style="width:100%;padding:8px;margin-top:8px;border:1px solid #ddd;border-radius:8px"></form>
      </div>
    `;
  }));
}

async function refresh(){
  state.users = await api.users();
  if (!state.currentUser) state.currentUser = state.users[0] || null;
  renderUsers();
  await loadPosts();
}

function bindEvents(){
  document.getElementById('current-user').addEventListener('change', e=>{
    state.currentUser = state.users.find(u=>u.id===Number(e.target.value));
  });
  document.getElementById('post-form').addEventListener('submit', async e=>{
    e.preventDefault();
    const content = document.getElementById('post-content').value.trim();
    if (!content || !state.currentUser) return;
    await api.newPost({ userId: state.currentUser.id, content });
    document.getElementById('post-content').value = '';
    await refresh();
  });
  document.body.addEventListener('click', async e=>{
    if (e.target.matches('[data-like]')){
      await api.like(e.target.dataset.like);
      await refresh();
    }
    if (e.target.matches('[data-follow]')){
      await api.follow(e.target.dataset.follow, { followerId: state.currentUser.id });
      await refresh();
    }
  });
  document.body.addEventListener('submit', async e=>{
    if (e.target.matches('[data-comment]')){
      e.preventDefault();
      const postId = e.target.dataset.comment;
      const content = e.target.comment.value.trim();
      if (!content || !state.currentUser) return;
      await api.comment(postId, { userId: state.currentUser.id, content });
      await refresh();
    }
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await refresh();
  bindEvents();
});
