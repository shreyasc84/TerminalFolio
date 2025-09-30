;(() => {
  const COMMANDS = ["about_me", "projects", "contact", "socials"]
  const contentEl = document.getElementById("content")
  const sqlOut = document.getElementById("sql-output")
  const sqlCursor = document.getElementById("sql-cursor")
  const sqlHint = document.getElementById("sql-hint")
  const input = document.getElementById("cmd-input")
  const runBtn = document.getElementById("run-btn")
  const year = document.getElementById("year")
  if (year) year.textContent = String(new Date().getFullYear())

  let data = null
  let typingTimer = null

  // Fetch content once
  fetch("/content.json")
    .then((r) => r.json())
    .then((json) => {
      data = json
    })
    .catch((err) => {
      console.error("[v0] content.json load error:", err)
    })

  // Utilities
  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild)
  }
  function el(tag, props = {}, children = []) {
    const n = document.createElement(tag)
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") n.className = v
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v)
      else if (v !== null && v !== undefined) n.setAttribute(k, v)
    })
    ;(Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return
      n.appendChild(typeof c === "string" ? document.createTextNode(c) : c)
    })
    return n
  }

  function typeWriter(text, onDone) {
    // stop prior typing
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    sqlOut.textContent = ""
    let i = 0
    sqlCursor.classList.remove("hidden")

    const step = () => {
      if (i <= text.length) {
        sqlOut.textContent = text.slice(0, i)
        i += 1
        typingTimer = setTimeout(step, 18)
      } else {
        sqlCursor.classList.add("hidden")
        if (typeof onDone === "function") onDone()
      }
    }
    step()
  }

  // Renderers
  function renderAbout() {
    if (!data) return
    clearNode(contentEl)
    const about = data["about_me"]
    const section = el("div", {}, [
      el("div", { class: "prompt small muted" }, "cat about.txt"),
      el("div", { class: "card" }, [
        el("h3", {}, "About Me"),
        el("p", {}, about.bio),
        el("div", { class: "label", ariaLabel: "Skills" }, "skills/"),
        el(
          "ul",
          {},
          about.skills.map((s) => el("li", {}, s)),
        ),
      ]),
    ])
    contentEl.appendChild(section)
    section.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function renderProjects() {
    if (!data) return
    clearNode(contentEl)
    contentEl.appendChild(el("div", { class: "prompt small muted" }, "ls projects/"))
    ;(data.projects || []).forEach((p) => {
      const card = el("div", { class: "card" }, [
        el("h3", {}, p.title),
        el("p", {}, p.description),
        el("div", { class: "linkbar" }, [
          el("a", { class: "link", href: p.live, target: "_blank", rel: "noopener noreferrer" }, "Live Preview"),
          el("a", { class: "link", href: p.repo, target: "_blank", rel: "noopener noreferrer" }, "Repo Link"),
        ]),
      ])
      contentEl.appendChild(card)
    })

    contentEl.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function renderContact() {
    if (!data) return
    clearNode(contentEl)
    const info = data.contact || {}
    const out = el("div", { class: "out", id: "contact-out" })

    const form = el(
      "form",
      {
        class: "form",
        onsubmit: (e) => {
          e.preventDefault()
          out.textContent = ""
          const email = form.querySelector("input[name=email]").value.trim()
          const message = form.querySelector("textarea[name=message]").value.trim()

          const errors = []
          if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("echo 'Invalid email'")
          if (!message || message.length < 6) errors.push("echo 'Message must be at least 6 characters'")

          if (errors.length) {
            out.textContent = errors.join("\n")
            return
          }
          // Simulate success
          out.textContent = "echo 'Message sent!'"
          form.reset()
        },
      },
      [
        el("div", { class: "label" }, "cat contact.txt"),
        el("div", { class: "label" }, `email -> ${info.email || "n/a"}`),
        info.phone ? el("div", { class: "label" }, `phone -> ${info.phone}`) : null,

        el("label", { class: "label", for: "email" }, "email"),
        el("input", { class: "input", id: "email", name: "email", type: "email", placeholder: "you@example.com" }),

        el("label", { class: "label", for: "message" }, "message"),
        el("textarea", { class: "textarea", id: "message", name: "message", placeholder: "write your message..." }),

        el("div", {}, el("button", { class: "btn", type: "submit" }, "Send")),
      ],
    )

    contentEl.appendChild(form)
    contentEl.appendChild(out)
    contentEl.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function renderSocials() {
    if (!data) return
    clearNode(contentEl)
    contentEl.appendChild(el("div", { class: "prompt small muted" }, "ls socials/"))
    ;(data.socials || []).forEach((s) => {
      const row = el("div", { class: "card" }, [
        el("a", { class: "link", href: s.href, target: "_blank", rel: "noopener noreferrer" }, s.label),
      ])
      contentEl.appendChild(row)
    })
    contentEl.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function execute(cmd) {
    if (!COMMANDS.includes(cmd)) {
      // help hint
      clearNode(contentEl)
      contentEl.appendChild(
        el("div", { class: "out" }, "echo 'Unknown command. Try: about_me | projects | contact | socials'"),
      )
      return
    }

    const sql = `select ${cmd} from shreyas;`
    if (sqlHint) sqlHint.classList.add("hidden")

    typeWriter(sql, () => {
      // render section after query displayed
      switch (cmd) {
        case "about_me":
          return renderAbout()
        case "projects":
          return renderProjects()
        case "contact":
          return renderContact()
        case "socials":
          return renderSocials()
      }
    })
  }

  // Wire up chips
  document.querySelectorAll(".chip[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.getAttribute("data-cmd")
      execute(cmd)
    })
  })

  // Wire up input Enter and Run button
  input &&
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const cmd = input.value.trim()
        execute(cmd)
      }
    })
  runBtn &&
    runBtn.addEventListener("click", () => {
      const cmd = input.value.trim()
      execute(cmd)
    })
})()
