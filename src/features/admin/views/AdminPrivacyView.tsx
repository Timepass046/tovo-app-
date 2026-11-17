import React from 'react';
import { ShieldCheck, Lock, EyeOff, Database, Trash2, KeyRound } from 'lucide-react';

export const AdminPrivacyView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#E8E7E0] dark:border-[#2C302A]">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B6F67] dark:text-[#9C9F97]">
          Governance & Data Protection
        </span>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#20231F] dark:text-[#F2F1ED] mt-0.5">
          Privacy Architecture & Security Boundaries
        </h1>
        <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] mt-0.5">
          Technical specifications governing user data confidentiality, analytics anonymization, and administrative access restrictions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Policy Card 1: Zero Private Inspection */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center gap-2.5 text-[#303FCA] dark:text-[#5263FA]">
            <EyeOff className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Strict Zero-Content Inspection
            </h3>
          </div>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            The Tovo Admin Console is engineered to prevent administrators from inspecting private user content. Tasks, notes, meeting details, subtasks, and personal habit journals are scoped exclusively to the authenticated owner's UID in Firestore.
          </p>
          <div className="p-2.5 rounded bg-[#F7F6F2] dark:bg-[#242722] text-[11px] font-mono text-[#20231F] dark:text-[#F2F1ED]">
            Firestore Rule: request.auth.uid == resource.data.userId
          </div>
        </div>

        {/* Policy Card 2: Anonymized Telemetry */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center gap-2.5 text-[#375336] dark:text-[#7EB384]">
            <Database className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Sanitized Telemetry Ingestion
            </h3>
          </div>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            Activity events ingested into <code className="font-mono text-[11px]">/activityEvents</code> contain only high-level event types (e.g. TASK_CREATED, HABIT_COMPLETED) and integer counts. Text fields, descriptions, titles, and authentication tokens are actively redacted at the client and server levels.
          </p>
          <div className="p-2.5 rounded bg-[#F7F6F2] dark:bg-[#242722] text-[11px] font-mono text-[#20231F] dark:text-[#F2F1ED]">
            Payload Schema: id, userId, eventType, timestamp, platform
          </div>
        </div>

        {/* Policy Card 3: Custom Claims & RBAC */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center gap-2.5 text-[#C99700]">
            <KeyRound className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Firebase Custom Claims RBAC
            </h3>
          </div>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            Administrative authorization is asserted via cryptographically signed Firebase Custom Claims (<code className="font-mono text-[11px]">admin: true</code>) issued exclusively by the Firebase Admin SDK on the backend server. Frontend profiles cannot escalate roles.
          </p>
          <div className="p-2.5 rounded bg-[#F7F6F2] dark:bg-[#242722] text-[11px] font-mono text-[#20231F] dark:text-[#F2F1ED]">
            Token Claim: request.auth.token.admin == true
          </div>
        </div>

        {/* Policy Card 4: Cascade Deletion & Retention */}
        <div className="p-5 rounded-xl bg-white dark:bg-[#1C1F1B] border border-[#E8E7E0] dark:border-[#2C302A] space-y-3">
          <div className="flex items-center gap-2.5 text-[#C73E2E] dark:text-[#E06C5E]">
            <Trash2 className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-[#20231F] dark:text-[#F2F1ED]">
              Complete Cascade Account Purge
            </h3>
          </div>
          <p className="text-xs text-[#6B6F67] dark:text-[#9C9F97] leading-relaxed">
            When a user requests account deletion, a server-side batch transaction permanently purges all documents across tasks, habits, habit logs, preferences, and activity events, followed by revoking the Firebase Auth credential record.
          </p>
          <div className="p-2.5 rounded bg-[#F7F6F2] dark:bg-[#242722] text-[11px] font-mono text-[#20231F] dark:text-[#F2F1ED]">
            Retention: Deletion is immediate and irreversible.
          </div>
        </div>
      </div>
    </div>
  );
};
