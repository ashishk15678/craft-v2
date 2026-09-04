"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

type Challenge = {
  id: string;
  title: string;
  slug: string;
  track: string;
  status: string;
  access: string;
  priceCents: number;
  updatedAt: string;
  _count: { stages: number; enrollments: number };
};
type Review = {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  enrollment: {
    user: { name: string; email: string };
    challenge: { id: string; title: string };
  };
};
type CreatorData = {
  challenges: Challenge[];
  reviewQueue: Review[];
  metrics: {
    total: number;
    published: number;
    learners: number;
    pendingReviews: number;
  };
};
type OrgMember = {
  id: string;
  role: string;
  joinedAt?: string;
  user: { id: string; name: string; email: string; role: string };
};
type Organization = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  ownerId?: string | null;
  _count: { members: number };
  members: OrgMember[];
  teamTracks: {
    id: string;
    title: string;
    description: string;
    challenge: { id: string; title: string } | null;
  }[];
};
type OrganizationData = {
  currentUser: { id: string; globalRole: string };
  organizations: Organization[];
  metrics: { organizations: number; members: number; tracks: number };
};
type PlatformData = {
  challengeCounts: { status: string; _count: { _all: number } }[];
  userCounts: { role: string; _count: { _all: number } }[];
  pendingChallenges: {
    id: string;
    title: string;
    track: string;
    updatedAt: string;
    creator: { name: string; email: string };
    _count: { stages: number };
  }[];
  recentAudit: {
    id: string;
    action: string;
    target: string;
    createdAt: string;
    actor: { name: string; email: string } | null;
  }[];
  users: { id: string; name: string; email: string; role: string }[];
  orgCount?: number;
};
type OrgManagerData = {
  organizations: Organization[];
  userCounts: { role: string; _count: { _all: number } }[];
  recentAudit: {
    id: string;
    action: string;
    target: string;
    createdAt: string;
    actor: { name: string; email: string } | null;
  }[];
  metrics: {
    organizations: number;
    totalMembers: number;
    totalTracks: number;
    totalUsers: number;
  };
};

// ─── Shared helpers ──────────────────────────────────────────────────────────

const ORG_ROLES = ["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR", "LEARNER"] as const;
const ORG_ROLE_HIERARCHY: Record<string, number> = {
  ORG_OWNER: 4,
  ORG_ADMIN: 3,
  INSTRUCTOR: 2,
  LEARNER: 1,
};

export const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text outline-none focus:border-indigo-500";
export const buttonClass =
  "rounded-lg border border-border bg-accent px-3 py-2 font-mono text-xs font-bold uppercase text-text transition-colors hover:border-indigo-500 disabled:opacity-50";

export function Stat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-accent p-3">
      <p className="font-mono text-lg font-bold text-text">{value}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </p>
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border p-4 text-sm text-zinc-500">
      {children}
    </p>
  );
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(value),
  );
}
export async function request(path: string, body?: object) {
  const res = await fetch(
    path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── OrgRoleBadge ────────────────────────────────────────────────────────────

function OrgRoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ORG_OWNER: "text-amber-400",
    ORG_ADMIN: "text-indigo-400",
    INSTRUCTOR: "text-emerald-400",
    LEARNER: "text-zinc-400",
  };
  return (
    <span
      className={`font-mono text-[10px] font-bold uppercase ${colors[role] ?? "text-zinc-500"}`}
    >
      {role.replace("_", " ")}
    </span>
  );
}

// ─── TeacherWorkspace ────────────────────────────────────────────────────────

export function TeacherWorkspace() {
  const [data, setData] = useState<CreatorData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await request("/api/workspace/creator"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load workspace");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(body: object) {
    setSaving(true);
    setError("");
    try {
      await request("/api/workspace/creator", body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function createChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stageCount = Number(form.get("stageCount"));
    const stages = Array.from({ length: stageCount }, (_, i) => ({
      title: form.get(`stage-${i}-title`),
      brief: form.get(`stage-${i}-brief`),
      hint: form.get(`stage-${i}-hint`),
      testCommand: form.get(`stage-${i}-test`),
    }));
    setSaving(true);
    setError("");
    try {
      await request("/api/workspace/creator", {
        action: "createChallenge",
        title: form.get("title"),
        slug: form.get("slug"),
        summary: form.get("summary"),
        track: form.get("track"),
        access: form.get("access"),
        priceCents: form.get("priceCents"),
        languages: form.get("languages"),
        dockerImage: form.get("dockerImage"),
        starterRepo: form.get("starterRepo"),
        stages,
      });
      event.currentTarget.reset();
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to create challenge");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Creator workspace
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase black-ops-one-regular">
              Teach by shipping.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Publish Docker-tested, progressive challenges and resolve learner
              architecture checkpoints.
            </p>
          </div>
          <button
            className={buttonClass}
            onClick={() => setShowForm((o) => !o)}
          >
            {showForm ? "Close authoring" : "New challenge +"}
          </button>
        </div>
        {data && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={data.metrics.total} label="authored" />
            <Stat value={data.metrics.published} label="published" />
            <Stat value={data.metrics.learners} label="learners enrolled" />
            <Stat value={data.metrics.pendingReviews} label="reviews waiting" />
          </div>
        )}
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}
      {showForm && <ChallengeForm saving={saving} onSubmit={createChallenge} />}
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Your challenge catalog
        </p>
        <div className="mt-4 space-y-2">
          {data?.challenges.length ? (
            data.challenges.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-lg bg-accent p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs font-bold uppercase">
                    {c.title}{" "}
                    <span className="font-normal text-zinc-500">
                      / {c.track}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {c._count.stages} stages · {c._count.enrollments} enrolled ·
                    updated {formatDate(c.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-indigo-400">
                    {c.status}
                  </span>
                  {c.status === "DRAFT" && (
                    <button
                      disabled={saving}
                      onClick={() =>
                        void act({
                          action: "submitForReview",
                          challengeId: c.id,
                        })
                      }
                      className={buttonClass}
                    >
                      Submit review
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : data ? (
            <Empty>Create a challenge to start your catalog.</Empty>
          ) : (
            <Empty>Loading…</Empty>
          )}
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Peer review queue
        </p>
        <div className="mt-4 space-y-2">
          {data?.reviewQueue.length ? (
            data.reviewQueue.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-lg bg-accent p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs font-bold uppercase">
                    {r.enrollment.user.name}{" "}
                    <span className="font-normal text-zinc-500">
                      / {r.enrollment.challenge.title}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Requested {formatDate(r.createdAt)} ·{" "}
                    {r.notes || "No learner note."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={() =>
                      void act({
                        action: "resolveReview",
                        reviewId: r.id,
                        status: "CHANGES_REQUESTED",
                      })
                    }
                    className={buttonClass}
                  >
                    Request changes
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      void act({
                        action: "resolveReview",
                        reviewId: r.id,
                        status: "APPROVED",
                      })
                    }
                    className={buttonClass}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))
          ) : data ? (
            <Empty>No reviews waiting.</Empty>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ChallengeForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const [stageCount, setStageCount] = useState(6);
  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-xl border border-indigo-500/40 bg-card p-5 space-y-4"
    >
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Open challenge SDK
        </p>
        <h2 className="mt-1 text-xl font-black uppercase black-ops-one-regular">
          Author a challenge
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          name="title"
          placeholder="Challenge title"
          className={inputClass}
        />
        <input
          name="slug"
          placeholder="URL slug (optional)"
          className={inputClass}
        />
        <input
          required
          name="track"
          placeholder="Track, e.g. DevOps & Infra"
          className={inputClass}
        />
        <input
          required
          name="languages"
          defaultValue="TypeScript,Python,Go,Rust"
          className={inputClass}
        />
        <select name="access" className={inputClass}>
          <option value="OPEN">Open access</option>
          <option value="PAID">Paid access</option>
          <option value="PRIVATE">Private access</option>
        </select>
        <input
          name="priceCents"
          type="number"
          min="0"
          defaultValue="0"
          className={inputClass}
          aria-label="Price in cents"
        />
      </div>
      <textarea
        required
        name="summary"
        placeholder="What will builders ship and learn?"
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="starterRepo"
          type="url"
          placeholder="Starter repo URL (optional)"
          className={inputClass}
        />
        <input
          name="dockerImage"
          placeholder="Docker test image (optional)"
          className={inputClass}
        />
      </div>
      <label className="block text-xs font-mono text-zinc-400">
        Number of stages{" "}
        <select
          name="stageCount"
          value={stageCount}
          onChange={(e) => setStageCount(Number(e.target.value))}
          className="ml-2 rounded border border-border bg-background px-2 py-1 text-text"
        >
          {[6, 7, 8, 9, 10, 11, 12].map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </label>
      <div className="space-y-3">
        {Array.from({ length: stageCount }, (_, i) => (
          <fieldset
            key={i}
            className="grid gap-2 rounded-lg bg-accent p-3 sm:grid-cols-2"
          >
            <legend className="px-1 font-mono text-[10px] text-indigo-400">
              Stage {i + 1}
            </legend>
            <input
              required
              name={`stage-${i}-title`}
              placeholder="Milestone title"
              className={inputClass}
            />
            <input
              required
              name={`stage-${i}-test`}
              placeholder="Test command"
              className={inputClass}
            />
            <textarea
              required
              name={`stage-${i}-brief`}
              placeholder="Stage brief"
              className={inputClass}
            />
            <textarea
              required
              name={`stage-${i}-hint`}
              placeholder="Minimal architectural hint"
              className={inputClass}
            />
          </fieldset>
        ))}
      </div>
      <button disabled={saving} className={buttonClass}>
        {saving ? "Saving…" : "Create draft challenge"}
      </button>
    </form>
  );
}

// ─── AdminWorkspace ──────────────────────────────────────────────────────────

export function AdminWorkspace({ role }: { role?: string }) {
  const [data, setData] = useState<OrganizationData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await request("/api/workspace/organization"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load organizations");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(body: object) {
    setSaving(true);
    setError("");
    try {
      await request("/api/workspace/organization", body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await act({ action, ...Object.fromEntries(form) });
    event.currentTarget.reset();
  }

  const isSuperUser = role === "SUPERADMIN" || role === "ORG_MANAGER";

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Organizations
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase black-ops-one-regular">
              Build our stack.
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Create internal onboarding tracks. Everyone can create and manage
              organizations.
            </p>
          </div>
        </div>
        {data && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat value={data.metrics.organizations} label="organizations" />
            <Stat value={data.metrics.tracks} label="team tracks" />
            <Stat value={data.metrics.members} label="members" />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-indigo-500/40 bg-card p-5">
        <p className="font-mono text-[10px] uppercase text-indigo-400">
          Start or join
        </p>
        <h2 className="mt-1 text-lg font-black uppercase black-ops-one-regular">
          Create new organization
        </h2>
        <form
          onSubmit={(e) => void submit(e, "createOrganization")}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            required
            name="name"
            placeholder="Organization name"
            className={inputClass}
          />
          <input
            name="slug"
            placeholder="URL slug (optional)"
            className={inputClass}
          />
          <button disabled={saving} className={buttonClass}>
            Create org
          </button>
        </form>
        <h2 className="mt-6 text-lg font-black uppercase black-ops-one-regular">
          Join an organization
        </h2>
        <form
          onSubmit={(e) => void submit(e, "joinOrganization")}
          className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <input
            required
            name="slug"
            placeholder="Organization URL slug"
            className={inputClass}
          />
          <button disabled={saving} className={buttonClass}>
            Join org
          </button>
        </form>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {data?.organizations.length ? (
        data.organizations.map((org) => {
          const myMembership = org.members.find(
            (m) => m.user.id === data.currentUser.id,
          );
          const myOrgRole = myMembership?.role ?? null;
          const myLevel = ORG_ROLE_HIERARCHY[myOrgRole ?? ""] ?? 0;
          const canAdmin = isSuperUser || myLevel >= 3; // ORG_OWNER or ORG_ADMIN

          return (
            <section
              key={org.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold uppercase">
                    {org.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {org.slug} · {org._count.members} members
                  </p>
                  {org.description && (
                    <p className="mt-1 text-xs text-zinc-500">
                      {org.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {myOrgRole && <OrgRoleBadge role={myOrgRole} />}
                  {(myOrgRole === "ORG_OWNER" || isSuperUser) && (
                    <button
                      disabled={saving}
                      onClick={() => {
                        if (
                          confirm(
                            `Delete "${org.name}"? This cannot be undone.`,
                          )
                        )
                          void act({
                            action: "deleteOrganization",
                            organizationId: org.id,
                          });
                      }}
                      className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-400 hover:bg-red-500/20"
                    >
                      Delete org
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                {/* Team tracks */}
                <div>
                  <p className="font-mono text-[10px] uppercase text-indigo-400">
                    Onboarding tracks
                  </p>
                  <div className="mt-2 space-y-2">
                    {org.teamTracks.length ? (
                      org.teamTracks.map((tt) => (
                        <div key={tt.id} className="rounded-lg bg-accent p-3">
                          <p className="font-mono text-xs font-bold uppercase">
                            {tt.title}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {tt.description}
                          </p>
                          {tt.challenge && (
                            <p className="mt-2 font-mono text-[10px] text-indigo-400">
                              Challenge: {tt.challenge.title}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <Empty>No team tracks yet.</Empty>
                    )}
                  </div>
                  {(canAdmin || myOrgRole === "INSTRUCTOR") && (
                    <form
                      onSubmit={(e) => void submit(e, "createTeamTrack")}
                      className="mt-3 space-y-2"
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={org.id}
                      />
                      <input
                        required
                        name="title"
                        placeholder="New team track title"
                        className={inputClass}
                      />
                      <textarea
                        required
                        name="description"
                        placeholder="Internal learning outcome"
                        className={inputClass}
                      />
                      <button disabled={saving} className={buttonClass}>
                        Create track
                      </button>
                    </form>
                  )}
                </div>

                {/* Members */}
                <div id="people">
                  <p className="font-mono text-[10px] uppercase text-indigo-400">
                    People &amp; access
                  </p>
                  <div className="mt-2 space-y-2">
                    {org.members.map((member) => {
                      const memberLevel = ORG_ROLE_HIERARCHY[member.role] ?? 0;
                      const canChange =
                        canAdmin &&
                        (isSuperUser || memberLevel < myLevel) &&
                        member.user.id !== data.currentUser.id;
                      return (
                        <div
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent p-3"
                        >
                          <div>
                            <span className="text-sm font-medium text-text">
                              {member.user.name || member.user.email}
                            </span>
                            <span className="ml-2 text-xs text-zinc-500">
                              {member.user.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {canChange ? (
                              <select
                                value={member.role}
                                disabled={saving}
                                onChange={(e) =>
                                  void act({
                                    action: "updateMemberRole",
                                    organizationId: org.id,
                                    memberId: member.id,
                                    newRole: e.target.value,
                                  })
                                }
                                className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-text"
                              >
                                {ORG_ROLES.filter(
                                  (r) =>
                                    isSuperUser ||
                                    ORG_ROLE_HIERARCHY[r] < myLevel,
                                ).map((r) => (
                                  <option key={r} value={r}>
                                    {r.replace("_", " ")}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <OrgRoleBadge role={member.role} />
                            )}
                            {canChange && (
                              <button
                                disabled={saving}
                                onClick={() =>
                                  void act({
                                    action: "removeMember",
                                    organizationId: org.id,
                                    memberId: member.id,
                                  })
                                }
                                className="rounded px-2 py-1 font-mono text-[10px] text-red-400 hover:bg-red-500/10"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {canAdmin && (
                    <form
                      onSubmit={(e) => void submit(e, "addMember")}
                      className="mt-3 flex flex-wrap gap-2"
                    >
                      <input
                        type="hidden"
                        name="organizationId"
                        value={org.id}
                      />
                      <input
                        required
                        type="email"
                        name="email"
                        placeholder="User email"
                        className={inputClass}
                      />
                      <select
                        name="memberRole"
                        className={inputClass}
                        defaultValue="LEARNER"
                      >
                        {ORG_ROLES.filter(
                          (r) => isSuperUser || ORG_ROLE_HIERARCHY[r] < myLevel,
                        ).map((r) => (
                          <option key={r} value={r}>
                            {r.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <button disabled={saving} className={buttonClass}>
                        Add
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </section>
          );
        })
      ) : data ? (
        <Empty>
          You have no organization memberships yet. Create one above.
        </Empty>
      ) : (
        <Empty>Loading organizations…</Empty>
      )}
    </div>
  );
}

// ─── SuperadminWorkspace ─────────────────────────────────────────────────────

export function SuperadminWorkspace() {
  const [data, setData] = useState<PlatformData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await request("/api/workspace/platform"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load platform data");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(body: object) {
    setSaving(true);
    setError("");
    try {
      await request("/api/workspace/platform", body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  const published =
    data?.challengeCounts.find((c) => c.status === "PUBLISHED")?._count._all ??
    0;
  const review =
    data?.challengeCounts.find((c) => c.status === "REVIEW")?._count._all ?? 0;
  const users = data?.userCounts.reduce((t, c) => t + c._count._all, 0) ?? 0;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
          Superadmin / platform control
        </p>
        <h1 className="mt-1 text-3xl font-black uppercase black-ops-one-regular">
          Operate the ecosystem.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Moderate challenge releases, govern roles, and retain an auditable
          record of platform changes.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={users} label="registered users" />
          <Stat value={published} label="published challenges" />
          <Stat value={review} label="awaiting moderation" />
          <Stat value={data?.orgCount ?? "—"} label="organizations" />
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      <section
        id="trust"
        className="rounded-xl border border-border bg-card p-5"
      >
        <p className="font-mono text-[10px] uppercase text-indigo-400">
          Trust &amp; safety / release gate
        </p>
        <div className="mt-4 space-y-2">
          {data?.pendingChallenges.length ? (
            data.pendingChallenges.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-3 rounded-lg bg-accent p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-xs font-bold uppercase">
                    {c.title}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {c.creator.email} · {c.track} · {c._count.stages} stages
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={() =>
                      void act({
                        action: "moderateChallenge",
                        challengeId: c.id,
                        status: "DRAFT",
                      })
                    }
                    className={buttonClass}
                  >
                    Return to draft
                  </button>
                  <button
                    disabled={saving}
                    onClick={() =>
                      void act({
                        action: "moderateChallenge",
                        challengeId: c.id,
                        status: "PUBLISHED",
                      })
                    }
                    className={buttonClass}
                  >
                    Publish
                  </button>
                </div>
              </div>
            ))
          ) : data ? (
            <Empty>No challenges waiting for moderation.</Empty>
          ) : (
            <Empty>Loading…</Empty>
          )}
        </div>
      </section>

      <section
        id="analytics"
        className="rounded-xl border border-border bg-card p-5"
      >
        <p className="font-mono text-[10px] uppercase text-indigo-400">
          Identity governance
        </p>
        <div className="mt-4 space-y-2">
          {data?.users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-2 rounded-lg bg-accent p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{u.name || u.email}</p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <select
                value={u.role}
                disabled={saving || u.role === "ORG_MANAGER"}
                onChange={(e) =>
                  void act({
                    action: "updateUserRole",
                    userId: u.id,
                    role: e.target.value,
                  })
                }
                className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-text disabled:opacity-50"
              >
                {["STUDENT", "TEACHER", "EDITOR", "ADMIN", "SUPERADMIN"].map(
                  (r) => (
                    <option key={r}>{r}</option>
                  ),
                )}
                {u.role === "ORG_MANAGER" && (
                  <option value="ORG_MANAGER">ORG_MANAGER</option>
                )}
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase text-indigo-400">
          System audit
        </p>
        <div className="mt-4 space-y-2">
          {data?.recentAudit.map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between gap-3 rounded-lg bg-accent p-3"
            >
              <div>
                <p className="font-mono text-xs">{entry.action}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {entry.actor?.email || "System"} · {entry.target}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-zinc-500">
                {formatDate(entry.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── OrgManagerWorkspace ─────────────────────────────────────────────────────

export function OrgManagerWorkspace() {
  const [data, setData] = useState<OrgManagerData | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await request("/api/workspace/org-manager"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data");
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  async function act(body: object) {
    setSaving(true);
    setError("");
    try {
      await request("/api/workspace/org-manager", body);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-amber-400">
          Platform owner / org manager
        </p>
        <h1 className="mt-1 text-3xl font-black uppercase black-ops-one-regular">
          Full platform control.
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          You are the sole ORG_MANAGER. You have unrestricted access to every
          organization, member, and role on this platform.
        </p>
        {data && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat value={data.metrics.organizations} label="organizations" />
            <Stat value={data.metrics.totalMembers} label="total members" />
            <Stat value={data.metrics.totalTracks} label="team tracks" />
            <Stat value={data.metrics.totalUsers} label="platform users" />
          </div>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {error}
        </p>
      )}

      {/* All organizations with full control */}
      {data?.organizations.map((org) => (
        <section
          key={org.id}
          className="rounded-xl border border-border bg-card p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs font-bold uppercase">
                {org.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {org.slug} · {org._count.members} members
              </p>
              {org.description && (
                <p className="mt-1 text-xs text-zinc-500 italic">
                  {org.description}
                </p>
              )}
            </div>
            <button
              disabled={saving}
              onClick={() => {
                if (confirm(`Force-delete "${org.name}"?`))
                  void act({
                    action: "forceDeleteOrganization",
                    organizationId: org.id,
                  });
              }}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1 font-mono text-[10px] font-bold uppercase text-red-400 hover:bg-red-500/20"
            >
              Force delete
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {org.members.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-accent p-3"
              >
                <div>
                  <span className="text-sm font-medium">{m.user.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">
                    {m.user.email}
                  </span>
                  <span className="ml-2 font-mono text-[10px] text-zinc-500">
                    global: {m.user.role}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    disabled={saving}
                    onChange={(e) =>
                      void act({
                        action: "setOrgMemberRole",
                        memberId: m.id,
                        newRole: e.target.value,
                      })
                    }
                    className="rounded border border-border bg-background px-2 py-1 font-mono text-xs text-text"
                  >
                    {ORG_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={saving}
                    onClick={() =>
                      void act({ action: "forceRemoveMember", memberId: m.id })
                    }
                    className="rounded px-2 py-1 font-mono text-[10px] text-red-400 hover:bg-red-500/10"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Audit log */}
      <section className="rounded-xl border border-border bg-card p-5">
        <p className="font-mono text-[10px] uppercase text-amber-400">
          Platform audit log
        </p>
        <div className="mt-4 space-y-2">
          {data?.recentAudit.map((entry) => (
            <div
              key={entry.id}
              className="flex justify-between gap-3 rounded-lg bg-accent p-3"
            >
              <div>
                <p className="font-mono text-xs">{entry.action}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {entry.actor?.email || "System"} · {entry.target}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-zinc-500">
                {formatDate(entry.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── RoleGateway ─────────────────────────────────────────────────────────────

/**
 * RoleGateway – shows role-specific workspace shortcuts.
 *
 * @param role     Global platform role (e.g. "STUDENT", "TEACHER", "SUPERADMIN")
 * @param orgRole  Optional per-org role from the currently-active organization.
 *                 When present, unlocks Teaching Studio / Org Admin for users whose
 *                 global role alone would not qualify (e.g. a STUDENT who is an
 *                 INSTRUCTOR inside an org).
 */
export function RoleGateway({
  role,
  orgRole,
}: {
  role: string;
  orgRole?: string | null;
}) {
  const workspaces: { title: string; href: string; desc: string }[] = [];

  // ── Platform-level entries ──
  if (role === "ORG_MANAGER") {
    workspaces.push({
      title: "Org manager",
      href: "/dashboard/org-manager",
      desc: "Full platform-level org control.",
    });
    workspaces.push({
      title: "Platform control",
      href: "/dashboard/platform",
      desc: "Challenge moderation and user governance.",
    });
  }
  if (role === "SUPERADMIN") {
    workspaces.push({
      title: "Platform control",
      href: "/dashboard/platform",
      desc: "Challenge moderation and user governance.",
    });
  }

  // ── Teaching access (global role OR org-level INSTRUCTOR/OWNER/ADMIN) ──
  const canTeach =
    ["TEACHER", "EDITOR", "ADMIN", "SUPERADMIN", "ORG_MANAGER"].includes(
      role,
    ) ||
    (!!orgRole && ["ORG_OWNER", "ORG_ADMIN", "INSTRUCTOR"].includes(orgRole));
  if (canTeach) {
    workspaces.push({
      title: "Teaching studio",
      href: "/dashboard/teach",
      desc: "Author challenges and review learners.",
    });
  }

  // ── Org admin access (global admin roles OR org-level ORG_OWNER / ORG_ADMIN) ──
  const canOrgAdmin =
    ["ADMIN", "SUPERADMIN", "ORG_MANAGER"].includes(role) ||
    (!!orgRole && ["ORG_OWNER", "ORG_ADMIN"].includes(orgRole));

  // Everyone can see the org management page (create / join orgs)
  workspaces.push({
    title: canOrgAdmin ? "Org management" : "Organizations",
    href: "/dashboard/admin",
    desc: canOrgAdmin
      ? "Manage members, tracks, and org settings."
      : "Create and manage your organizations.",
  });

  if (workspaces.length === 0) return null;

  return (
    <section className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[.18em] text-indigo-400">
        Role workspace{workspaces.length > 1 ? "s" : ""} available
        {orgRole && (
          <span className="ml-2 normal-case font-normal text-zinc-500">
            · org role: {orgRole.replace(/_/g, " ").toLowerCase()}
          </span>
        )}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {workspaces.map((ws) => (
          <div
            key={ws.href}
            className="rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-4"
          >
            <h2 className="text-lg font-black uppercase black-ops-one-regular text-indigo-100">
              {ws.title}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">{ws.desc}</p>
            <Link
              href={ws.href}
              className="mt-3 inline-block font-mono text-xs font-bold uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open workspace →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
