"use client";

import Modal from "./modal";

type Props = {
  open: boolean;
  total: string;
  items: number;
  payment: string;
  onClose: () => void;
};

export function SaleSuccessModal({
  open,
  total,
  items,
  payment,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Venda concluída ✅">
      <div className="space-y-4">
        <p className="text-gray-600">
          Sua venda foi registrada com sucesso.
        </p>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Itens vendidos</span>
            <span className="font-semibold">{items}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Pagamento</span>
            <span className="font-semibold">{payment}</span>
          </div>

          <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span>{total}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-black px-5 py-3 text-white font-semibold hover:opacity-90"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}
