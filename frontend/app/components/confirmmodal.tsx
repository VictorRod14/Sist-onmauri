"use client";

import Modal from "./modal";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} onClose={onCancel} title={title ?? "Confirmar ação"}>
      <p className="text-sm text-gray-600">{message}</p>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-red-600 text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </Modal>
  );
}
