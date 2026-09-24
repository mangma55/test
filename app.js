(() => {
  "use strict";

  const page = document.body.dataset.page;
  const config = window.DEMO_CONFIG;
  const $ = (id) => document.getElementById(id);
  const setStatus = (id, message, error = false) => {
    const element = $(id);
    element.textContent = message;
    element.classList.toggle("error", error);
  };
  const pageUrl = (filename) => new URL(filename, window.location.href).href;

  function isPublicKey(key) {
    if (typeof key !== "string") return false;
    if (key.startsWith("sb_publishable_")) return !key.includes("REPLACE_ME");
    // Legacy anon key เป็น JWT; ตรวจ role เพื่อไม่ให้วาง service_role ผิด
    try {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.role === "anon";
    } catch (_) {
      return false;
    }
  }

  if (!config || !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(config.url) ||
      config.url.includes("YOUR_PROJECT_ID") || !config.publishableKey ||
      !isPublicKey(config.publishableKey)) {
    showSetupError("กรุณาใส่ Project URL และ Publishable key ใน js/config.js ก่อนใช้งาน");
    return;
  }
  if (!window.supabase) {
    showSetupError("โหลด supabase-js ไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
    return;
  }

  const client = window.supabase.createClient(config.url.replace(/\/$/, ""), config.publishableKey);

  function showSetupError(message) {
    if (page === "login") {
      setStatus("login-status", message, true);
      $("login-button").disabled = true;
    } else {
      $("loading").textContent = message;
      $("loading").classList.add("error");
    }
  }

  if (page === "login") {
    initLogin();
  } else if (page === "dashboard") {
    initDashboard();
  }

  async function initLogin() {
    const form = $("login-form");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = $("login-button");
      button.disabled = true;
      setStatus("login-status", "กำลังเข้าสู่ระบบ…");
      try {
        const { error } = await client.auth.signInWithPassword({
          email: $("email").value.trim(), password: $("password").value
        });
        if (error) throw error;
        window.location.assign(pageUrl("dashboard.html"));
      } catch (error) {
        setStatus("login-status", `เข้าสู่ระบบไม่สำเร็จ: ${error.message}`, true);
        button.disabled = false;
      }
    });
    const { data, error } = await client.auth.getUser();
    if (!error && data.user) window.location.replace(pageUrl("dashboard.html"));
  }

  async function initDashboard() {
    try {
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) {
        window.location.replace(pageUrl("index.html"));
        return;
      }
      $("user-email").textContent = data.user.email || "ผู้ใช้ที่เข้าสู่ระบบ";
      $("dashboard-content").hidden = false;
      $("loading").hidden = true;
      $("logout-button").addEventListener("click", async () => {
        const button = $("logout-button");
        button.disabled = true;
        const { error: signOutError } = await client.auth.signOut();
        if (signOutError) {
          setStatus("list-status", signOutError.message, true);
          button.disabled = false;
        } else {
          window.location.replace(pageUrl("index.html"));
        }
      });
      $("refresh-button").addEventListener("click", loadNotes);
      $("cancel-edit").addEventListener("click", resetForm);
      $("note-form").addEventListener("submit", saveNote);
      await loadNotes();
    } catch (error) {
      $("loading").textContent = `เชื่อมต่อไม่ได้: ${error.message}`;
      $("loading").classList.add("error");
    }
  }

  let editingId = null;
  function resetForm() {
    editingId = null;
    $("note-form").reset();
    $("form-title").textContent = "เพิ่มข้อความ";
    $("save-button").textContent = "บันทึกข้อความ";
    $("cancel-edit").hidden = true;
    setStatus("note-status", "");
  }

  async function loadNotes() {
    const refresh = $("refresh-button");
    refresh.disabled = true;
    setStatus("list-status", "กำลังโหลดข้อมูล…");
    try {
      const { data, error } = await client.from("demo_notes")
        .select("id,message,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      renderNotes(data);
      setStatus("list-status", data.length ? "" : "ยังไม่มีข้อความ ลองเพิ่มรายการแรกทางด้านซ้าย");
    } catch (error) {
      setStatus("list-status", `อ่านข้อมูลไม่สำเร็จ: ${error.message}`, true);
    } finally {
      refresh.disabled = false;
    }
  }

  function renderNotes(rows) {
    const list = $("note-list");
    list.replaceChildren();
    $("total-count").textContent = String(rows.length);
    $("last-updated").textContent = rows[0] ? formatDate(rows[0].created_at) : "—";
    for (const row of rows) {
      const item = document.createElement("li");
      item.className = "note-item";
      const message = document.createElement("p");
      message.className = "note-message";
      message.textContent = row.message;
      const bottom = document.createElement("div");
      bottom.className = "note-bottom";
      const date = document.createElement("time");
      date.textContent = formatDate(row.created_at);
      date.dateTime = row.created_at;
      const actions = document.createElement("div");
      actions.className = "note-actions";
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "text-button";
      edit.textContent = "แก้ไข";
      edit.addEventListener("click", () => {
        editingId = row.id;
        $("note-message").value = row.message;
        $("form-title").textContent = "แก้ไขข้อความ";
        $("save-button").textContent = "บันทึกการแก้ไข";
        $("cancel-edit").hidden = false;
        setStatus("note-status", "");
        $("note-message").focus();
      });
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button danger";
      remove.textContent = "ลบ";
      remove.addEventListener("click", async () => {
        if (!window.confirm("ลบข้อความนี้หรือไม่?")) return;
        remove.disabled = true;
        try {
          const { error } = await client.from("demo_notes").delete().eq("id", row.id);
          if (error) throw error;
          if (editingId === row.id) resetForm();
          await loadNotes();
        } catch (error) {
          setStatus("list-status", `ลบไม่สำเร็จ: ${error.message}`, true);
          remove.disabled = false;
        }
      });
      actions.append(edit, remove);
      bottom.append(date, actions);
      item.append(message, bottom);
      list.append(item);
    }
  }

  function formatDate(value) {
    return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
  }

  async function saveNote(event) {
    event.preventDefault();
    const message = $("note-message").value.trim();
    if (!message) return;
    const button = $("save-button");
    button.disabled = true;
    setStatus("note-status", "กำลังบันทึก…");
    try {
      const query = editingId
        ? client.from("demo_notes").update({ message }).eq("id", editingId)
        : client.from("demo_notes").insert({ message });
      const { error } = await query;
      if (error) throw error;
      resetForm();
      setStatus("note-status", "บันทึกสำเร็จ");
      await loadNotes();
    } catch (error) {
      setStatus("note-status", `บันทึกไม่สำเร็จ: ${error.message}`, true);
    } finally {
      button.disabled = false;
    }
  }
})();
