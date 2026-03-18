"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "../components/dashboardshell";
import Modal from "../components/modal";
import { ConfirmModal } from "../components/confirmmodal";

import {
  createSeller,
  deleteSeller,
  getSellers,
  Seller,
  updateSeller,
} from "../services/sellers";

export default function VendedorasPage() {
  const [list, setList] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal create/edit
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Seller | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // Access created modal
  const [createdAccess, setCreatedAccess] = useState<{
    name: string;
    email: string;
    temp_password: string;
  } | null>(null);

  // Delete confirm
  const [openDelete, setOpenDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Seller | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ✅ Load sellers
  async function load() {
    setLoading(true);
    try {
      const data = await getSellers();
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const subtitle = useMemo(() => {
    const total = list.length;
    const active = list.filter((s) => s.active).length;
    const inactive = total - active;
    return `${total} cadastradas • ${active} ativas • ${inactive} inativas`;
  }, [list]);

  function openCreate() {
    setError(null);
    setEditing(null);
    setName("");
    setEmail("");
    setOpenForm(true);
  }

  function openEdit(s: Seller) {
    setError(null);
    setEditing(s);
    setName(s.name);
    setEmail(s.email);
    setOpenForm(true);
  }

  function closeForm() {
    if (saving) return;
    setOpenForm(false);
    setEditing(null);
    setName("");
    setEmail("");
  }

  async function submit() {
    setError(null);

    const n = name.trim();
    const e = email.trim();

    if (!n) return setError("Nome é obrigatório.");
    if (!editing && !e) return setError("Email é obrigatório.");

    setSaving(true);

    try {
      if (editing) {
        await updateSeller(editing.id, { name: n });
      } else {
        const result = await createSeller(n, e);
        setCreatedAccess(result);
      }

      closeForm();
      await load();
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      setError(detail || "Erro ao salvar vendedora.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: Seller) {
    try {
      await updateSeller(s.id, { active: !s.active });
      await load();
    } catch {
      alert("Erro ao atualizar status.");
    }
  }

  function requestDelete(s: Seller) {
    setDeleteTarget(s);
    setOpenDelete(true);
  }

  function cancelDelete() {
    if (deleting) return;
    setOpenDelete(false);
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await deleteSeller(deleteTarget.id);
      cancelDelete();
      await load();
    } catch {
      alert("Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <DashboardShell
      title="Vendedoras"
      subtitle={subtitle}
      right={
        <button
          type="button"
          onClick={openCreate}
          className="relative z-50 rounded-2xl bg-black px-5 py-3 text-white font-medium shadow-sm hover:opacity-90"
        >
          + Nova vendedora
        </button>
      }
    >
      <main className="p-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Lista</h2>
            {loading && (
              <span className="text-sm text-gray-500">Carregando…</span>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-gray-600 sm:col-span-3">
                Nenhuma vendedora cadastrada ainda.
              </div>
            ) : (
              list.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{s.name}</div>

                      <div className="text-xs text-gray-500">{s.email}</div>

                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          s.active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {s.active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(s)}
                      className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-100"
                    >
                      {s.active ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => requestDelete(s)}
                      className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Modal
          open={openForm}
          onClose={closeForm}
          title={editing ? "Editar vendedora" : "Cadastrar vendedora"}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">Nome</label>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
              />
            </div>

            {!editing && (
              <div>
                <label className="text-xs font-semibold text-gray-600">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-2xl border px-4 py-2"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="rounded-2xl bg-black px-4 py-2 text-white"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </Modal>

        <ConfirmModal
          open={openDelete}
          title="Excluir vendedora"
          message={
            deleteTarget ? `Deseja excluir "${deleteTarget.name}" do sistema?` : ""
          }
          loading={deleting}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />

        {createdAccess && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl space-y-4">
              <h2 className="text-lg font-bold">✅ Acesso criado</h2>

              <p>
                <strong>Vendedora:</strong> {createdAccess.name}
              </p>
              <p>
                <strong>Email:</strong> {createdAccess.email}
              </p>

              <div className="bg-gray-100 rounded-xl p-4">
                <p className="text-xs">Senha temporária</p>
                <p className="text-lg font-mono tracking-widest">
                  {createdAccess.temp_password}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCreatedAccess(null)}
                className="w-full bg-black text-white py-2 rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}