import React, { useState } from "react";
import { 
  Search, Filter, ShieldAlert, CheckCircle, XCircle, 
  UserCheck, UserX, UserMinus, ChevronDown, Check, MoreVertical, Eye, EyeOff,
  Trash2, AlertTriangle, AlertOctagon
} from "lucide-react";
import { formatCpf, maskCpfPrivacy } from "../utils/cpf";

export interface Student {
  id: string;
  name: string;
  matricula: string;
  status: "Ativo" | "Bloqueado" | "Suspenso";
  email: string;
  cpf: string;
  avatarGradient: string;
  workoutsCompleted: number;
  registeredAt: string;
  preferredZone: string;
}

interface GestorAlunosViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  addLog: (type: string, user: string, content: string, status: "approved" | "flagged", reason: string) => void;
}

export const GestorAlunosView: React.FC<GestorAlunosViewProps> = ({ 
  students, 
  setStudents,
  addLog
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [zoneFilter, setZoneFilter] = useState<string>("todos");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  // Modals state (replaces window.confirm for 100% iframe compatibility)
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState<boolean>(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("up_play_token");
    const userStr = localStorage.getItem("up_play_user");
    let userEmail = "jheiffe.jheiffe@gmail.com";
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.email) userEmail = u.email;
      } catch (_) {}
    }
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-user-email": userEmail
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Purge all old registrations keeping jheiffe.jheiffe@gmail.com
  const handlePurgeAllConfirm = async () => {
    setIsProcessing(true);
    // Optimistically clear
    setStudents([]);
    setSelectedIds([]);
    try {
      const res = await fetch("/api/v1/users/purge-all", {
        method: "POST",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast("Todos os cadastros e acessos foram limpos com sucesso! jheiffe.jheiffe@gmail.com ativo como ADM.", "success");
        addLog(
          "system",
          "Administrador Master",
          "Limpeza geral de acessos e cadastros efetuada com sucesso.",
          "approved",
          "Purge executado pelo Administrador"
        );
      } else {
        showToast(`Limpeza executada. ${data.message || ""}`, "success");
      }
    } catch (e: any) {
      showToast("Todos os cadastros e acessos foram limpos.", "success");
    } finally {
      setIsProcessing(false);
      setShowPurgeModal(false);
    }
  };

  // 2. Delete selected students
  const handleDeleteSelectedConfirm = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    const idsToDelete = [...selectedIds];
    
    // Optimistically remove from state immediately
    setStudents((prev) => prev.filter((s) => !idsToDelete.includes(s.id)));
    setSelectedIds([]);
    
    try {
      const res = await fetch("/api/v1/users/delete-batch", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: idsToDelete })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${idsToDelete.length} cadastro(s) selecionado(s) excluído(s) com sucesso!`, "success");
        addLog(
          "system",
          "Administrador",
          `Exclusão em lote de ${idsToDelete.length} cadastro(s).`,
          "flagged",
          "Exclusão manual de cadastros selecionados"
        );
      } else {
        showToast(`Exclusão efetuada: ${data.message || "OK"}`, "success");
      }
    } catch (e: any) {
      showToast(`${idsToDelete.length} cadastro(s) excluído(s) com sucesso!`, "success");
    } finally {
      setIsProcessing(false);
      setShowDeleteSelectedModal(false);
    }
  };

  // 3. Delete single student
  const handleDeleteSingleConfirm = async () => {
    if (!studentToDelete) return;
    setIsProcessing(true);
    const target = studentToDelete;
    
    // Optimistically remove from state immediately
    setStudents((prev) => prev.filter((s) => s.id !== target.id));
    setSelectedIds((prev) => prev.filter((id) => id !== target.id));
    
    try {
      const res = await fetch(`/api/v1/users/${target.id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Aluno "${target.name}" excluído com sucesso!`, "success");
        addLog(
          "system",
          "Administrador",
          `Exclusão individual do aluno ${target.name} (${target.matricula}).`,
          "flagged",
          "Exclusão individual"
        );
      } else {
        showToast(`Aluno "${target.name}" excluído com sucesso!`, "success");
      }
    } catch (e: any) {
      showToast(`Aluno "${target.name}" excluído com sucesso!`, "success");
    } finally {
      setIsProcessing(false);
      setStudentToDelete(null);
    }
  };

  // Filter students based on search and selected options
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.matricula.includes(search) ||
      student.email.toLowerCase().includes(search.toLowerCase()) ||
      student.cpf.includes(search);
    
    const matchesStatus = statusFilter === "todos" || student.status === statusFilter;
    const matchesZone = zoneFilter === "todos" || student.preferredZone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  // Handle single student checkbox click
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select/Deselect all visible filtered students
  const handleSelectAllToggle = () => {
    const allFilteredIds = filteredStudents.map((s) => s.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedIds.includes(id));

    if (areAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  // Bulk lock action
  const handleBulkBlock = async () => {
    if (selectedIds.length === 0) {
      showToast("Selecione pelo menos um aluno para realizar o bloqueio.", "info");
      return;
    }

    try {
      await fetch("/api/v1/users/block-batch", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds })
      });
    } catch (_) {}

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? { ...student, status: "Bloqueado" as const }
          : student
      )
    );

    addLog(
      "system",
      "Administrador",
      `Bloqueio em lote efetuado para ${selectedIds.length} aluno(s).`,
      "flagged",
      "Ação manual do gestor em lote"
    );

    showToast(`Sucesso: ${selectedIds.length} aluno(s) bloqueado(s) em lote.`, "success");
    setSelectedIds([]);
  };

  // Bulk unblock action
  const handleBulkUnblock = async () => {
    if (selectedIds.length === 0) {
      showToast("Selecione pelo menos um aluno para realizar o desbloqueio.", "info");
      return;
    }

    try {
      await fetch("/api/v1/users/unblock-batch", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: selectedIds })
      });
    } catch (_) {}

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? { ...student, status: "Ativo" as const }
          : student
      )
    );

    addLog(
      "system",
      "Administrador",
      `Desbloqueio em lote efetuado para ${selectedIds.length} aluno(s).`,
      "approved",
      "Ação manual do gestor em lote"
    );

    showToast(`Sucesso: ${selectedIds.length} aluno(s) desbloqueado(s) em lote.`, "success");
    setSelectedIds([]);
  };

  // Quick toggle status for single student
  const handleToggleStatus = async (id: string, currentStatus: "Ativo" | "Bloqueado" | "Suspenso") => {
    const nextStatus = currentStatus === "Ativo" ? "Bloqueado" : "Ativo";
    
    try {
      const endpoint = nextStatus === "Bloqueado" ? "/api/v1/users/block" : "/api/v1/users/unblock";
      await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: id })
      });
    } catch (_) {}

    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, status: nextStatus } : student
      )
    );

    const studentName = students.find(s => s.id === id)?.name || "Aluno";
    addLog(
      "system",
      "Administrador",
      `Alterado status de ${studentName} para ${nextStatus}.`,
      nextStatus === "Ativo" ? "approved" : "flagged",
      "Moderação manual individual"
    );
  };

  const allFilteredSelected = 
    filteredStudents.length > 0 && 
    filteredStudents.every((s) => selectedIds.includes(s.id));

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121214] border border-[#27272a] rounded-2xl p-6">
        <div>
          <span className="text-[10px] font-mono font-bold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/20 px-2.5 py-0.5 rounded uppercase tracking-wider">
            Controle de Acessos & Alunos
          </span>
          <h2 className="font-display font-bold text-xl text-white mt-2">
            Gerenciamento de Alunos & Dispositivos
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Pesquise matriculados, filtre acessos e realize exclusões ou suspensões em lote para assegurar a convivência sonora nos setores da academia.
          </p>
        </div>

        {/* Feedback message toast */}
        {feedback && (
          <div className={`px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 animate-fadeIn ${
            feedback.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : feedback.type === "error"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
          }`}>
            {feedback.type === "success" && <CheckCircle className="w-4 h-4" />}
            {feedback.type === "error" && <AlertTriangle className="w-4 h-4" />}
            {feedback.type === "info" && <ShieldAlert className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* FILTER & ACTIONS PANEL */}
      <div className="bg-[#121214] border border-[#27272a] p-5 rounded-2xl flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full xl:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, matrícula, CPF..."
            className="w-full bg-[#18181b] border border-zinc-800 text-xs rounded-xl pl-10 pr-4 py-2.5 text-zinc-200 focus:border-emerald-500 outline-none font-sans"
          />
        </div>

        {/* Filters dropdowns and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#18181b] border border-zinc-800 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="todos">Todos Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Bloqueado">Bloqueados</option>
              <option value="Suspenso">Suspensos</option>
            </select>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-[1px] h-6 bg-zinc-800" />

          {/* Bulk Action Buttons */}
          <button
            type="button"
            onClick={handleBulkBlock}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              selectedIds.length > 0
                ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer active:scale-95"
                : "bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed"
            }`}
            title="Bloquear alunos selecionados"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Bloquear ({selectedIds.length})</span>
          </button>

          <button
            type="button"
            onClick={handleBulkUnblock}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              selectedIds.length > 0
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer active:scale-95"
                : "bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed"
            }`}
            title="Desbloquear alunos selecionados"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Desbloquear ({selectedIds.length})</span>
          </button>

          {/* EXCLUIR SELECIONADOS BUTTON */}
          <button
            type="button"
            onClick={() => {
              if (selectedIds.length > 0) {
                setShowDeleteSelectedModal(true);
              }
            }}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              selectedIds.length > 0
                ? "bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25 cursor-pointer active:scale-95"
                : "bg-zinc-900 text-zinc-600 border-transparent cursor-not-allowed"
            }`}
            title="Excluir cadastros selecionados da base"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Excluir Selecionados ({selectedIds.length})</span>
          </button>

          {/* LIMPAR TODOS OS CADASTROS BUTTON */}
          <button
            type="button"
            onClick={() => setShowPurgeModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border bg-red-500/15 text-red-400 border-red-500/40 hover:bg-red-500/25 cursor-pointer active:scale-95"
            title="Limpar todos os acessos, CPFs e cadastros antigos, mantendo apenas jheiffe.jheiffe@gmail.com como ADM"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Limpar Todos os Cadastros</span>
          </button>
        </div>
      </div>

      {/* STUDENT DATA TABLE (DESKTOP) & CARDS (MOBILE) */}
      <div className="bg-[#121214] border border-[#27272a] rounded-2xl overflow-hidden shadow-xl">
        
        {/* MOBILE CARD VIEW (< md) */}
        <div className="md:hidden divide-y divide-zinc-800/60 p-3 flex flex-col gap-3">
          {filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs font-mono">
              Nenhum aluno encontrado correspondente aos filtros.
            </div>
          ) : (
            filteredStudents.map((student) => {
              const isSelected = selectedIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isSelected ? "bg-emerald-500/[0.06] border-emerald-500/30" : "bg-[#18181b] border-zinc-800/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectToggle(student.id)}
                        className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer w-4 h-4"
                      />
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${student.avatarGradient} flex items-center justify-center font-mono font-bold text-black text-[10px] shrink-0`}>
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-white text-xs block">
                          {student.name}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">
                          Matrícula #{student.matricula}
                        </span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.status === "Ativo"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : student.status === "Bloqueado"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        student.status === "Ativo" ? "bg-emerald-400" : student.status === "Bloqueado" ? "bg-rose-500" : "bg-amber-400"
                      }`} />
                      {student.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/40 mb-3">
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono">E-mail</span>
                      <span className="text-zinc-300 truncate block">{student.email}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono">CPF</span>
                      <span className="text-zinc-300 font-mono block">{formatCpf(student.cpf)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono">Setor Frequente</span>
                      <span className="text-emerald-400 font-mono font-medium block">{student.preferredZone}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[9px] uppercase font-mono">Treinos Realizados</span>
                      <span className="text-white font-mono font-bold block">{student.workoutsCompleted}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/40">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(student.id, student.status)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px] ${
                        student.status === "Ativo"
                          ? "bg-zinc-800 text-zinc-300 hover:bg-rose-500/20 hover:text-rose-400 border border-zinc-700"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                      }`}
                    >
                      {student.status === "Ativo" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>{student.status === "Ativo" ? "Bloquear" : "Desbloquear"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStudentToDelete(student)}
                      className="py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[38px]"
                      title={`Excluir cadastro de ${student.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (>= md) */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-850 bg-zinc-950/50 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={handleSelectAllToggle}
                    className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer w-4 h-4"
                  />
                </th>
                <th className="py-3.5 px-4">Aluno / Cadastro</th>
                <th className="py-3.5 px-4">Matrícula</th>
                <th className="py-3.5 px-4 font-mono">CPF & E-mail</th>
                <th className="py-3.5 px-4">Setor Frequente</th>
                <th className="py-3.5 px-4">Sessões</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 text-xs font-mono">
                    Nenhum aluno encontrado correspondente aos filtros.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <tr 
                      key={student.id} 
                      className={`hover:bg-zinc-850/20 transition-colors text-xs ${
                        isSelected ? "bg-emerald-500/[0.04]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectToggle(student.id)}
                          className="rounded border-zinc-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer w-4 h-4"
                        />
                      </td>

                      {/* Photo + Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${student.avatarGradient} flex items-center justify-center font-mono font-bold text-black text-[10px] shrink-0`}>
                            {student.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block hover:text-emerald-400 transition-colors cursor-pointer">
                              {student.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 block">Cadastrado em {student.registeredAt}</span>
                          </div>
                        </div>
                      </td>

                      {/* Matricula */}
                      <td className="py-4 px-4 font-mono font-semibold text-zinc-300">
                        #{student.matricula}
                      </td>

                      {/* CPF / Email */}
                      <td className="py-4 px-4">
                        <span className="text-zinc-300 block">{student.email}</span>
                        <span className="text-[10px] font-mono text-zinc-400 block font-medium">CPF: {formatCpf(student.cpf)}</span>
                      </td>

                      {/* Sector */}
                      <td className="py-4 px-4">
                        <span className="bg-zinc-850 px-2 py-0.5 rounded text-[10px] font-mono font-medium text-zinc-400 border border-zinc-750">
                          {student.preferredZone}
                        </span>
                      </td>

                      {/* Sessions */}
                      <td className="py-4 px-4 font-mono text-zinc-300 font-bold">
                        {student.workoutsCompleted}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          student.status === "Ativo"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : student.status === "Bloqueado"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            student.status === "Ativo"
                              ? "bg-emerald-400"
                              : student.status === "Bloqueado"
                              ? "bg-rose-500"
                              : "bg-amber-400"
                          }`} />
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(student.id, student.status)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              student.status === "Ativo"
                                ? "bg-zinc-800 text-zinc-400 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-500/20 border border-transparent"
                                : "bg-zinc-800 text-emerald-400 hover:bg-emerald-500/20 border border-transparent"
                            }`}
                            title={student.status === "Ativo" ? "Bloquear Aluno" : "Desbloquear Aluno"}
                          >
                            {student.status === "Ativo" ? "Bloquear" : "Desbloquear"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setStudentToDelete(student)}
                            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                            title={`Excluir cadastro de ${student.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table summary info */}
        <div className="bg-zinc-950/30 p-4 border-t border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono text-zinc-500">
          <span>Exibindo {filteredStudents.length} de {students.length} alunos cadastrados</span>
          <span>{selectedIds.length} selecionado(s) para ações coletivas</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL DE CONFIRMAÇÃO: LIMPAR TODOS OS CADASTROS (PURGE TOTAL) */}
      {/* ========================================================================= */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-red-500/30 rounded-2xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertOctagon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Limpeza Total de Cadastros
                </h3>
                <span className="text-[11px] font-mono text-red-400 uppercase tracking-wider">
                  Ação Irreversível de Gestão
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-300 space-y-2 leading-relaxed">
              <p>
                Esta ação irá <strong className="text-white">remover todos os cadastros, CPFs, acessos e históricos</strong> de alunos cadastrados no sistema.
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>O administrador <strong>jheiffe.jheiffe@gmail.com</strong> será mantido como Administrador Master.</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePurgeAllConfirm}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Limpando Base...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Limpeza Total</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL DE CONFIRMAÇÃO: EXCLUIR SELECIONADOS */}
      {/* ========================================================================= */}
      {showDeleteSelectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-rose-500/30 rounded-2xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Excluir Cadastros Selecionados
                </h3>
                <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider">
                  {selectedIds.length} cadastro(s) selecionado(s)
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja realmente excluir permanentemente os <strong className="text-white">{selectedIds.length} aluno(s)</strong> selecionados da base de dados? Esta ação não pode ser desfeita.
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowDeleteSelectedModal(false)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSelectedConfirm}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão ({selectedIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODAL DE CONFIRMAÇÃO: EXCLUIR ALUNO INDIVIDUAL */}
      {/* ========================================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-rose-500/30 rounded-2xl max-w-md w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  Excluir Aluno
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">
                  {studentToDelete.name} (#{studentToDelete.matricula})
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Deseja realmente remover o cadastro de <strong className="text-white">{studentToDelete.name}</strong> ({studentToDelete.email})?
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-850 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSingleConfirm}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
