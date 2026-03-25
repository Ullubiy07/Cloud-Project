const AUTH_URL = "/auth";
const EXEC_URL = "/api";

function authHeader() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiLogin(username, password) {
    const res = await fetch(`${AUTH_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error("Login failed");
    return res.json();
}

export async function apiRegister(username, email, password) {
    const res = await fetch(`${AUTH_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) throw new Error("Register failed");
    return res.json();
}

export async function apiRun(language, entryFile, files, stdin = "") {
    const res = await fetch(`${EXEC_URL}/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeader(),
        },
        body: JSON.stringify({
            language,
            entry_file: entryFile,
            files,
            stdin,
        }),
    });
    if (!res.ok) throw new Error("Execution failed");
    return res.json();
}

export async function apiGetRun(id) {
    const res = await fetch(`${EXEC_URL}/run/${id}`, {
        headers: authHeader(),
    });
    if (!res.ok) throw new Error("Failed to fetch run status");
    return res.json();
}