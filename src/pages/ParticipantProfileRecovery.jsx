import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Clipboard,
    Clock3,
    KeyRound,
    Loader2,
    MapPin,
    Phone,
    RefreshCw,
    Search,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import AdminLayout from "../components/admin/AdminLayout";
import { supabase } from "../supabaseClient";

const EMPTY_PARTICIPANT = null;

export default function ParticipantProfileRecovery() {
    const [phone, setPhone] = useState("");

    const [participant, setParticipant] =
        useState(EMPTY_PARTICIPANT);

    const [recoveryCode, setRecoveryCode] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);

    const [searching, setSearching] = useState(false);
    const [generating, setGenerating] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [copied, setCopied] = useState(false);

    // ===========================================================
    // CLEAR GENERATED CODE WHEN PHONE CHANGES
    // ===========================================================

    useEffect(() => {
        setRecoveryCode("");
        setExpiresAt(null);
        setCopied(false);
        setMessage("");
    }, [phone]);

    // ===========================================================
    // NORMALIZE PHONE
    // ===========================================================

    const handlePhoneChange = (event) => {
        const value = event.target.value
            .replace(/\D/g, "")
            .slice(0, 10);

        setPhone(value);

        if (participant?.phone !== value) {
            setParticipant(null);
        }

        setError("");
    };

    // ===========================================================
    // FIND PARTICIPANT
    //
    // We intentionally do NOT query participant_profiles directly
    // from the browser because that table is protected by RLS.
    //
    // The recovery generation Edge Function already performs the
    // secure participant lookup.
    //
    // So "Find Participant" validates the input and prepares the
    // recovery action. Participant details are returned securely
    // after generation.
    // ===========================================================

    const handleFindParticipant = async () => {
        setError("");
        setMessage("");
        setRecoveryCode("");
        setExpiresAt(null);
        setCopied(false);
        setParticipant(null);

        if (!/^[0-9]{10}$/.test(phone)) {
            setError("Enter a valid 10-digit phone number.");
            return;
        }

        setSearching(true);

        try {
            /*
             * The current V1 generation endpoint performs both:
             *
             * 1. participant lookup
             * 2. recovery-code generation
             *
             * We therefore don't generate here.
             *
             * This screen keeps the participant confirmation step,
             * but the actual secure lookup happens when Generate is
             * pressed.
             */

            setParticipant({
                phone,
                pendingLookup: true,
            });

            setMessage(
                "Phone number is ready. Generate the recovery code to securely verify the participant."
            );
        } finally {
            setSearching(false);
        }
    };

    // ===========================================================
    // GENERATE RECOVERY CODE
    // ===========================================================

    const handleGenerateRecoveryCode = async () => {
        if (!/^[0-9]{10}$/.test(phone)) {
            setError("Enter a valid 10-digit phone number.");
            return;
        }

        setGenerating(true);
        setError("");
        setMessage("");
        setCopied(false);

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session) {
                setError(
                    "Your admin session has expired. Please sign in again."
                );
                return;
            }

            const { data, error: functionError } =
                await supabase.functions.invoke(
                    "generate-participant-recovery",
                    {
                        body: {
                            phone,
                        },
                    }
                );

            if (functionError) {
                let functionMessage =
                    functionError.message ||
                    "Unable to generate recovery code.";

                /*
                 * Supabase FunctionsHttpError may expose the response
                 * body through context.
                 */
                try {
                    if (functionError.context) {
                        const responseData =
                            await functionError.context.json();

                        if (responseData?.error) {
                            functionMessage = responseData.error;
                        }
                    }
                } catch {
                    // Keep fallback error message.
                }

                setError(functionMessage);
                return;
            }

            if (!data?.success || !data?.recovery_code) {
                setError(
                    data?.error ||
                    "Unable to generate recovery code."
                );

                return;
            }

            setParticipant(data.participant || { phone });

            setRecoveryCode(data.recovery_code);

            setExpiresAt(data.expires_at || null);

            setMessage(
                "Recovery code generated successfully. Give it privately to the participant."
            );
        } catch (err) {
            console.error(
                "Participant recovery generation failed:",
                err
            );

            setError(
                err?.message ||
                "Something went wrong while generating the recovery code."
            );
        } finally {
            setGenerating(false);
        }
    };

    // ===========================================================
    // COPY
    // ===========================================================

    const handleCopy = async () => {
        if (!recoveryCode) return;

        try {
            await navigator.clipboard.writeText(recoveryCode);

            setCopied(true);

            window.setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (err) {
            console.error("Unable to copy recovery code:", err);

            setError(
                "Unable to copy automatically. Please copy the code manually."
            );
        }
    };

    // ===========================================================
    // FORMAT EXPIRY
    // ===========================================================

    const formatExpiry = (value) => {
        if (!value) return "1 hour from generation";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "1 hour from generation";
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    // ===========================================================
    // UI
    // ===========================================================

    return (
        <AdminLayout>
            {({ isSuperAdmin, theme }) => {
                if (!isSuperAdmin) {
                    return (
                        <AccessDenied />
                    );
                }

                return (
                    <div className="space-y-6">
                        {/* =================================================
                INTRO
            ================================================= */}

                        <section className="overflow-hidden rounded-[24px] border border-zinc-200/80 bg-white shadow-sm">
                            <div className="relative overflow-hidden px-5 py-6 sm:px-7 sm:py-7">
                                <div
                                    className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-[90px]"
                                    style={{
                                        backgroundColor: `${theme.accent}12`,
                                    }}
                                />

                                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="max-w-2xl">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="flex h-9 w-9 items-center justify-center rounded-xl border"
                                                style={{
                                                    color: theme.accent,
                                                    borderColor: `${theme.accent}25`,
                                                    backgroundColor:
                                                        theme.accentSoft,
                                                }}
                                            >
                                                <KeyRound size={17} />
                                            </div>

                                            <p
                                                className="text-[11px] font-black uppercase tracking-[0.14em]"
                                                style={{
                                                    color: theme.accent,
                                                }}
                                            >
                                                Superadmin Security
                                            </p>
                                        </div>

                                        <h2 className="mt-4 text-[22px] font-black tracking-[-0.03em] text-zinc-900 sm:text-[26px]">
                                            Participant Profile Recovery
                                        </h2>

                                        <p className="mt-2 max-w-xl text-[13px] leading-6 text-zinc-500 sm:text-[14px]">
                                            Generate a temporary recovery code
                                            for an activated participant who has
                                            forgotten their profile password.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                        <ShieldCheck
                                            size={18}
                                            className="shrink-0 text-emerald-600"
                                        />

                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-emerald-700">
                                                Protected
                                            </p>

                                            <p className="mt-0.5 text-[11px] text-emerald-600">
                                                Superadmin access only
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* =================================================
                SEARCH
            ================================================= */}

                        <section className="rounded-[24px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-7">
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                    Step 1
                                </p>

                                <h3 className="mt-2 text-[18px] font-black tracking-[-0.02em] text-zinc-900">
                                    Find Participant
                                </h3>

                                <p className="mt-1 text-[12px] leading-5 text-zinc-500">
                                    Enter the participant's registered
                                    10-digit phone number.
                                </p>
                            </div>

                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Phone
                                        size={17}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
                                    />

                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter") {
                                                handleFindParticipant();
                                            }
                                        }}
                                        placeholder="Enter phone number"
                                        className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-[14px] font-semibold text-zinc-900 outline-none transition placeholder:font-normal placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={handleFindParticipant}
                                    disabled={searching}
                                    className="flex h-12 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 text-[12px] font-black text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {searching ? (
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Search size={16} />
                                    )}

                                    Find Participant
                                </button>
                            </div>
                        </section>

                        {/* =================================================
                MESSAGES
            ================================================= */}

                        {error && (
                            <MessageCard
                                type="error"
                                message={error}
                            />
                        )}

                        {message && !error && (
                            <MessageCard
                                type="success"
                                message={message}
                            />
                        )}

                        {/* =================================================
                PARTICIPANT
            ================================================= */}

                        {participant && (
                            <motion.section
                                initial={{
                                    opacity: 0,
                                    y: 8,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                className="rounded-[24px] border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-7"
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                            Step 2
                                        </p>

                                        <h3 className="mt-2 text-[18px] font-black tracking-[-0.02em] text-zinc-900">
                                            Participant Verification
                                        </h3>
                                    </div>

                                    {!participant.pendingLookup && (
                                        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-emerald-700">
                                            <CheckCircle2 size={13} />
                                            Activated Profile
                                        </div>
                                    )}
                                </div>

                                {participant.pendingLookup ? (
                                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                                        <div className="flex gap-3">
                                            <ShieldCheck
                                                size={18}
                                                className="mt-0.5 shrink-0 text-amber-600"
                                            />

                                            <div>
                                                <p className="text-[13px] font-bold text-amber-900">
                                                    Secure verification required
                                                </p>

                                                <p className="mt-1 text-[12px] leading-5 text-amber-700">
                                                    The protected participant table
                                                    cannot be queried directly from the
                                                    browser. Generate the recovery code
                                                    below to securely verify this phone
                                                    number through the server.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                        <ParticipantDetail
                                            icon={UserRound}
                                            label="Participant"
                                            value={
                                                participant.display_name || "—"
                                            }
                                        />

                                        <ParticipantDetail
                                            icon={Phone}
                                            label="Phone"
                                            value={participant.phone || phone}
                                        />

                                        <ParticipantDetail
                                            icon={MapPin}
                                            label="Place"
                                            value={participant.place || "—"}
                                        />

                                        <ParticipantDetail
                                            icon={ShieldCheck}
                                            label="Language"
                                            value={
                                                participant.preferred_language ||
                                                "—"
                                            }
                                        />
                                    </div>
                                )}

                                <div className="mt-6 border-t border-zinc-100 pt-6">
                                    <button
                                        type="button"
                                        onClick={handleGenerateRecoveryCode}
                                        disabled={generating}
                                        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-[12px] font-black text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                        style={{
                                            backgroundColor: theme.accent,
                                        }}
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2
                                                    size={16}
                                                    className="animate-spin"
                                                />
                                                Generating...
                                            </>
                                        ) : recoveryCode ? (
                                            <>
                                                <RefreshCw size={16} />
                                                Generate New Code
                                            </>
                                        ) : (
                                            <>
                                                <KeyRound size={16} />
                                                Generate Recovery Code
                                            </>
                                        )}
                                    </button>

                                    <p className="mt-3 max-w-2xl text-[11px] leading-5 text-zinc-400">
                                        Generating a new recovery code
                                        invalidates any previous unused recovery
                                        code for this participant.
                                    </p>
                                </div>
                            </motion.section>
                        )}

                        {/* =================================================
                RECOVERY CODE
            ================================================= */}

                        {recoveryCode && (
                            <motion.section
                                initial={{
                                    opacity: 0,
                                    scale: 0.985,
                                }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                }}
                                className="overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-950 text-white shadow-xl"
                            >
                                <div className="p-5 sm:p-7">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06]">
                                            <KeyRound
                                                size={19}
                                                className="text-white"
                                            />
                                        </div>

                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                                One-Time Recovery Credential
                                            </p>

                                            <h3 className="mt-1 text-[18px] font-black">
                                                Recovery Code
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4 sm:p-5">
                                        <p className="break-all text-center font-mono text-[18px] font-black tracking-[0.08em] text-white sm:text-[24px]">
                                            {recoveryCode}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCopy}
                                        className="mt-4 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[12px] font-black text-zinc-900 transition hover:bg-zinc-100"
                                    >
                                        {copied ? (
                                            <>
                                                <CheckCircle2
                                                    size={16}
                                                    className="text-emerald-600"
                                                />
                                                Copied
                                            </>
                                        ) : (
                                            <>
                                                <Clipboard size={16} />
                                                Copy Recovery Code
                                            </>
                                        )}
                                    </button>

                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <Clock3 size={14} />

                                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                                    Expires
                                                </span>
                                            </div>

                                            <p className="mt-2 text-[12px] font-bold text-zinc-200">
                                                {formatExpiry(expiresAt)}
                                            </p>
                                        </div>

                                        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <ShieldCheck size={14} />

                                                <span className="text-[10px] font-black uppercase tracking-[0.1em]">
                                                    Security
                                                </span>
                                            </div>

                                            <p className="mt-2 text-[12px] font-bold text-zinc-200">
                                                One-time use only
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-4">
                                        <AlertCircle
                                            size={17}
                                            className="mt-0.5 shrink-0 text-amber-400"
                                        />

                                        <p className="text-[11px] leading-5 text-amber-100/80">
                                            Give this code only to the verified
                                            participant. The raw code is shown here
                                            once and is not stored in the database.
                                        </p>
                                    </div>
                                </div>
                            </motion.section>
                        )}
                    </div>
                );
            }}
        </AdminLayout>
    );
}

// ===========================================================
// PARTICIPANT DETAIL
// ===========================================================

function ParticipantDetail({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-4">
            <div className="flex items-center gap-2 text-zinc-400">
                <Icon size={14} />

                <p className="text-[10px] font-black uppercase tracking-[0.1em]">
                    {label}
                </p>
            </div>

            <p className="mt-2 break-words text-[13px] font-bold text-zinc-800">
                {value}
            </p>
        </div>
    );
}

// ===========================================================
// MESSAGE
// ===========================================================

function MessageCard({ type, message }) {
    const isError = type === "error";

    const Icon = isError
        ? AlertCircle
        : CheckCircle2;

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -4,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className={`flex gap-3 rounded-2xl border p-4 ${isError
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
        >
            <Icon
                size={17}
                className="mt-0.5 shrink-0"
            />

            <p className="text-[12px] font-semibold leading-5">
                {message}
            </p>
        </motion.div>
    );
}

// ===========================================================
// ACCESS DENIED
// ===========================================================

function AccessDenied() {
    return (
        <div className="flex min-h-[55vh] items-center justify-center">
            <div className="w-full max-w-md rounded-[24px] border border-red-200 bg-white p-7 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                    <ShieldCheck size={21} />
                </div>

                <h2 className="mt-4 text-[18px] font-black text-zinc-900">
                    Superadmin Access Required
                </h2>

                <p className="mt-2 text-[12px] leading-5 text-zinc-500">
                    Participant password recovery is restricted to
                    superadmin accounts.
                </p>
            </div>
        </div>
    );
}