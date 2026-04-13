import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { usePlan } from '../../lib/usePlan';

const STATUS_LABELS = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Pagada', color: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-500' },
};

export default function InvoiceDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [user, setUser] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const { isPro, loading: planLoading } = usePlan(user?.id);

  // Confirm modals
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---------- Auth & data load ----------
  useEffect(() => {
    if (!id) return;
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/login');
        return;
      }
      if (!mounted) return;
      setUser(data.session.user);
      await loadInvoice(id);
    };
    init();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadInvoice = async (invoiceId) => {
    try {
      const [{ data: invData, error: invError }, { data: linesData, error: linesError }] =
        await Promise.all([
          supabase.from('invoices').select('*').eq('id', invoiceId).maybeSingle(),
          supabase
            .from('invoice_lines')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('position', { ascending: true }),
        ]);
      if (invError) throw invError;
      if (linesError) throw linesError;
      setInvoice(invData);
      setLines(linesData || []);
    } catch (error) {
      console.error('Error loading invoice:', error);
      showToast('error', 'Error cargando la factura');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Status changes ----------
  const updateStatus = async (newStatus, extra = {}) => {
    setUpdating(true);
    try {
      const payload = { status: newStatus, ...extra };
      const { error } = await supabase
        .from('invoices')
        .update(payload)
        .eq('id', invoice.id);
      if (error) throw error;
      setInvoice((prev) => ({ ...prev, ...payload }));
      showToast('success', `Factura marcada como ${STATUS_LABELS[newStatus]?.label || newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('error', 'No se pudo actualizar');
    } finally {
      setUpdating(false);
      setShowStatusMenu(false);
    }
  };

  const markAsPaid = () =>
    updateStatus('paid', { paid_date: new Date().toISOString().slice(0, 10) });

  const markAsSent = () => updateStatus('sent', { paid_date: null });
  const markAsOverdue = () => updateStatus('overdue');
  const markAsCancelled = () => updateStatus('cancelled');

  // ---------- Delete (only drafts) ----------
  const deleteInvoice = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase.from('invoices').delete().eq('id', invoice.id);
      if (error) throw error;
      showToast('success', 'Factura borrada');
      router.push('/invoices');
    } catch (error) {
      console.error('Error deleting:', error);
      showToast('error', 'No se pudo borrar');
      setUpdating(false);
      setConfirmDelete(false);
    }
  };

  // ---------- PDF placeholder ----------
  const downloadPDF = () => {
    showToast('error', 'La descarga del PDF estará disponible muy pronto');
  };

  // ---------- Helpers ----------
  const formatEUR = (n) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n || 0);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  };

  // ---------- Loading ----------
  if (loading || planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="font-medium">Cargando factura…</span>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header isPro={isPro} />
        <main className="max-w-4xl mx-auto px-6 py-10">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
            <p className="text-slate-500 mb-4">Factura no encontrada.</p>
            <Link
              href="/invoices"
              className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
            >
              ← Volver a Mis facturas
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const status = STATUS_LABELS[invoice.status] || STATUS_LABELS.draft;
  const isDraft = invoice.status === 'draft';
  const isLocked = ['paid', 'cancelled'].includes(invoice.status);
  const freelancer = invoice.freelancer_snapshot || {};
  const client = invoice.client_snapshot || {};

  // ---------- Render ----------
  return (
    <>
      <Head>
        <title>Factura {invoice.invoice_number} · Timely</title>
      </Head>

      <div className="min-h-screen bg-slate-50">
        <Header isPro={isPro} />

        <main className="max-w-4xl mx-auto px-6 py-8 sm:py-10">
          {/* Top bar */}
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <Link
              href="/invoices"
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              ← Mis facturas
            </Link>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
              >
                ↓ Descargar PDF
              </button>
              {!isLocked && (
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    disabled={updating}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition text-sm disabled:opacity-60"
                  >
                    Cambiar estado ▾
                  </button>
                  {showStatusMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 min-w-[200px] py-1">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={markAsSent}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                        >
                          📤 Marcar como enviada
                        </button>
                      )}
                      {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                        <>
                          <button
                            onClick={markAsPaid}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                          >
                            ✓ Marcar como pagada
                          </button>
                          {invoice.status === 'sent' && (
                            <button
                              onClick={markAsOverdue}
                              className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                            >
                              ⚠ Marcar como vencida
                            </button>
                          )}
                          <button
                            onClick={markAsCancelled}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            ✕ Cancelar factura
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              {isDraft && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  disabled={updating}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-lg font-semibold hover:bg-red-100 transition text-sm disabled:opacity-60"
                >
                  Borrar
                </button>
              )}
            </div>
          </div>

          {/* Status banner */}
          <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-6 py-4 mb-6 shadow-sm">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.color}`}>
                {status.label}
              </span>
              <p className="text-sm text-slate-600">
                {invoice.status === 'paid' && invoice.paid_date && (
                  <>Cobrada el {formatDate(invoice.paid_date)}</>
                )}
                {invoice.status === 'sent' &&
                  invoice.due_date &&
                  `Vence el ${formatDate(invoice.due_date)}`}
                {invoice.status === 'overdue' &&
                  invoice.due_date &&
                  `Venció el ${formatDate(invoice.due_date)}`}
                {invoice.status === 'draft' && 'Aún no has enviado esta factura'}
                {invoice.status === 'cancelled' && 'Esta factura ha sido cancelada'}
              </p>
            </div>
            {isLocked && (
              <p className="text-xs text-slate-500">🔒 No editable</p>
            )}
          </div>

          {/* INVOICE PREVIEW (looks like the future PDF) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header with logo and freelancer info */}
            <div className="p-8 sm:p-10 border-b border-slate-100">
              <div className="flex flex-wrap justify-between items-start gap-6">
                <div className="flex items-start gap-4">
                  {freelancer.logo_url && (
                    <img
                      src={freelancer.logo_url}
                      alt="Logo"
                      className="w-20 h-20 object-contain"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">
                      {freelancer.legal_name || '—'}
                    </h2>
                    {freelancer.trade_name && (
                      <p className="text-sm text-slate-500">{freelancer.trade_name}</p>
                    )}
                    <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                      {freelancer.tax_id && <p>NIF: {freelancer.tax_id}</p>}
                      {freelancer.address && <p>{freelancer.address}</p>}
                      {(freelancer.postal_code || freelancer.city) && (
                        <p>
                          {freelancer.postal_code} {freelancer.city}
                          {freelancer.province && freelancer.province !== freelancer.city
                            ? `, ${freelancer.province}`
                            : ''}
                        </p>
                      )}
                      {freelancer.country && <p>{freelancer.country}</p>}
                      {freelancer.email && <p className="mt-1">{freelancer.email}</p>}
                      {freelancer.phone && <p>{freelancer.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Factura
                  </p>
                  <p className="text-3xl font-bold text-slate-900 font-mono mt-1">
                    {invoice.invoice_number}
                  </p>
                  <div className="text-xs text-slate-600 mt-3 space-y-0.5">
                    <p>
                      <span className="text-slate-500">Fecha emisión:</span>{' '}
                      <span className="font-semibold">{formatDate(invoice.issue_date)}</span>
                    </p>
                    {invoice.due_date && (
                      <p>
                        <span className="text-slate-500">Vencimiento:</span>{' '}
                        <span className="font-semibold">{formatDate(invoice.due_date)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bill to */}
            <div className="p-8 sm:p-10 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                Factura a
              </p>
              <h3 className="text-lg font-bold text-slate-900">{client.name || '—'}</h3>
              <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                {client.tax_id && <p>NIF: {client.tax_id}</p>}
                {client.address && <p>{client.address}</p>}
                {(client.postal_code || client.city) && (
                  <p>
                    {client.postal_code} {client.city}
                  </p>
                )}
                {client.country && <p>{client.country}</p>}
                {client.email && <p className="text-xs mt-1">{client.email}</p>}
              </div>
            </div>

            {/* Lines */}
            <div className="p-8 sm:p-10">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-slate-200">
                  <tr className="text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                    <th className="pb-3 pr-3">Descripción</th>
                    <th className="pb-3 px-2 text-right">Cant.</th>
                    <th className="pb-3 px-2 text-right">Precio</th>
                    <th className="pb-3 pl-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400 italic">
                        Sin líneas
                      </td>
                    </tr>
                  ) : (
                    lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-3 pr-3 text-slate-700">{line.description}</td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                          {Number(line.quantity).toFixed(2)}h
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-600">
                          {formatEUR(line.unit_price)}
                        </td>
                        <td className="py-3 pl-2 text-right tabular-nums font-semibold text-slate-900">
                          {formatEUR(line.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-slate-200 flex justify-end">
                <div className="w-full sm:w-80 space-y-2">
                  <div className="flex justify-between text-sm text-slate-700">
                    <span>Subtotal</span>
                    <span className="font-semibold tabular-nums">
                      {formatEUR(invoice.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-700">
                    <span>+ IVA ({invoice.vat_rate}%)</span>
                    <span className="font-semibold tabular-nums">
                      {formatEUR(invoice.vat_amount)}
                    </span>
                  </div>
                  {Number(invoice.irpf_rate) > 0 && (
                    <div className="flex justify-between text-sm text-slate-700">
                      <span>− IRPF ({invoice.irpf_rate}%)</span>
                      <span className="font-semibold tabular-nums">
                        −{formatEUR(invoice.irpf_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold text-slate-900 pt-3 border-t-2 border-slate-200 mt-3">
                    <span>TOTAL</span>
                    <span className="tabular-nums text-blue-700">
                      {formatEUR(invoice.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with payment terms and bank */}
            {(invoice.payment_terms || freelancer.iban || freelancer.invoice_footer) && (
              <div className="p-8 sm:p-10 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-3">
                {invoice.payment_terms && (
                  <div>
                    <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Condiciones de pago
                    </p>
                    <p>{invoice.payment_terms}</p>
                  </div>
                )}
                {freelancer.iban && (
                  <div>
                    <p className="font-bold text-slate-700 uppercase tracking-wide mb-1">
                      Datos bancarios
                    </p>
                    <p className="font-mono">{freelancer.iban}</p>
                    {freelancer.bank_name && <p>{freelancer.bank_name}</p>}
                  </div>
                )}
                {freelancer.invoice_footer && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="italic">{freelancer.invoice_footer}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Internal notes */}
          {invoice.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mt-6">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
                📝 Notas internas (solo tú las ves)
              </p>
              <p className="text-sm text-amber-900 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
        </main>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-sm ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Confirm delete modal */}
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-lg text-slate-900 mb-2">
                ¿Borrar este borrador?
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                Vas a borrar la factura{' '}
                <span className="font-semibold font-mono">{invoice.invoice_number}</span>.
                Esta acción no se puede deshacer. El número quedará disponible para una nueva factura.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteInvoice}
                  disabled={updating}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-60"
                >
                  {updating ? 'Borrando…' : 'Borrar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Subcomponents ----------
function Header({ isPro }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">⏱</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-slate-900">Timely</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isPro ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isPro ? 'PRO' : 'FREE'}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/dashboard"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Proyectos
          </Link>
          <Link
            href="/clients"
            className="px-3 sm:px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium"
          >
            Clientes
          </Link>
          <Link
            href="/invoices"
            className="px-3 sm:px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg font-semibold"
          >
            Facturas
          </Link>
        </div>
      </nav>
    </header>
  );
}
