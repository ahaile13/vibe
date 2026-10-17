'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLive } from './LiveProvider';
import { Cover, PostMedia } from './Media';
import { Icon } from './Icon';
import { Avatar, MomText, STATUS, StatusPill, WorthText, liveText, metaText, scored } from './bits';
import { SCORING, isActive, peakWindow, type Stats } from '@/lib/scoring';
import { ago, clock, dayLabel, plural } from '@/lib/format';
import { directionsUrl, fmtMi } from '@/lib/geo';
import type { CommentRow, EventRow } from '@/lib/types';

const VIBE_LABEL = { popping: '🔥 Popping', mid: '😐 Mid', dead: '💀 Dead' } as const;
const CONF_LABEL = { high: 'High confidence', build: 'Building confidence', none: 'Not enough data' } as const;

export function EventDetail({ id }: { id: string }) {
  const router = useRouter();
  const live = useLive();
  const { eventById, fetchEvent, refreshEvent, stats, rows, posts, now, dist, saved, toggleSave, startRate, openCapture, share, status, myRatings, openLightbox, user, deleteEvent, isAdmin } = live;
  const [missing, setMissing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const ev = eventById(id);

  useEffect(() => {
    if (status === 'unconfigured') return;
    let off = false;
    fetchEvent(id).then((e) => {
      if (!e && !off) setMissing(true);
    });
    refreshEvent(id);
    return () => {
      off = true;
    };
  }, [id, status, fetchEvent, refreshEvent]);

  if (!ev || !stats[ev.id]) {
    if (missing || status === 'unconfigured')
      return (
        <div className="empty" style={{ marginTop: 40 }}>
          <h3>This event isn’t available.</h3>
          <p>It may have been removed, or the link is wrong.</p>
          <Link className="btn pri" href="/">Back to Discover</Link>
        </div>
      );
    return <div className="skel" style={{ aspectRatio: 'auto', height: '60vh', margin: '-18px -16px 0' }} />;
  }

  const s = stats[ev.id];
  const activeNow = isActive(ev, now);
  const ended = now > Date.parse(ev.ends_at);
  const d = dist(ev);
  const sv = saved.has(ev.id);
  const mine = myRatings[ev.id] && Date.parse(myRatings[ev.id].at) >= Date.parse(ev.starts_at) ? myRatings[ev.id] : null;
  const evPosts = posts[ev.id] ?? [];
  const isOwner = user?.id === ev.created_by;

  return (
    <>
      <div className="dhero">
        <Cover event={ev} posts={evPosts} />
        <div className="shade" />
        <button className="back chip-g" aria-label="Back" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
          <Icon name="back" />
        </button>
        <div className="tl chip-g" style={{ left: 66, top: 22 }}>
          {activeNow && <span className="live">Live</span>}
          {liveText(ev, s, now)}
        </div>
        <div className="cb">
          <div className="area"><span>{ev.area ?? ev.category}</span>{ev.area && <span>{ev.category}</span>}{d != null && <span>{fmtMi(d)}</span>}</div>
          <h1>{ev.name}</h1>
          <div className="row"><StatusPill s={s} /><WorthText s={s} /><MomText s={s} /></div>
          <div className="meta">{metaText(ev, s, now)}</div>
        </div>
      </div>

      <div className="dbody">
        {ev.visibility === 'unlisted' && (
          <div className="notice" style={{ margin: 0 }}>
            <Icon name="flag" />
            <span>Private event. Only people with the link can find it{isOwner ? '; the address and pin stay hidden from guests' : ''}.</span>
          </div>
        )}

        <section className="panel" aria-label="Vibe score">
          <ScoreBlock ev={ev} s={s} />
          {mine && (
            <p className="foot-note">
              You rated it {VIBE_LABEL[mine.vibe].slice(3).toLowerCase()} and {mine.worth ? 'worth it' : 'not worth it'}, {ago(now - Date.parse(mine.at))}.
              {activeNow ? ' Rating again replaces it.' : ''}
            </p>
          )}
        </section>

        {s.n > 0 && (
          <section className="panel">
            <h2>{ended ? 'How it went' : 'The vibe right now'}</h2>
            <div className="bars">
              {([['Popping', 'var(--pop)', s.pp], ['Mid', 'var(--mid)', s.pm], ['Dead', 'var(--dead)', s.pd]] as const).map(([l, c, v]) => (
                <div className="bar" key={l}>
                  <span>{l}</span>
                  <div className="track"><div className="fill" style={{ ['--c' as string]: c, width: `${(v * 100).toFixed(1)}%` }} /></div>
                  <span className="pct">{Math.round(v * 100)}%</span>
                </div>
              ))}
            </div>
            <h2 style={{ marginTop: 22 }}>Worth it?</h2>
            <div className="worth">
              <span className="big" style={{ color: s.py >= 0.5 ? 'var(--yes)' : 'var(--no)' }}>{Math.round(s.py * 100)}%</span>
              <span style={{ color: 'var(--muted)' }}>say yes</span>
            </div>
            <div className="split">
              <i style={{ background: 'var(--yes)', flexBasis: `${s.py * 100}%` }} />
              <i style={{ background: 'var(--no)', flexBasis: `${(1 - s.py) * 100}%` }} />
            </div>
            <div className="foot-note">
              Based on {plural(s.n, 'verified rating')}
              {s.lastAt ? `, last one ${ago(now - s.lastAt)}` : ''}. {ended ? 'Final result.' : 'Recent ratings count most.'}
            </div>
          </section>
        )}

        {evPosts.length > 0 && (
          <section className="panel">
            <h2>{ended ? 'Top moments' : 'From people here'}</h2>
            <div className="strip">
              {evPosts.map((p) => (
                <button key={p.id} className="tile" onClick={() => openLightbox(p)} aria-label={`Open ${p.kind} by ${p.profiles?.username ?? 'someone'}`}>
                  <PostMedia post={p} />
                  <div className="shade" />
                  <span className="tag chip-g">{p.kind === 'video' ? '▶ Clip' : 'Photo'}</span>
                  <div className="capn">
                    <b>@{p.profiles?.username ?? 'someone'}</b>
                    <br />
                    {ago(now - Date.parse(p.created_at))}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        <Comments ev={ev} />

        <section className="panel">
          <h2>Details</h2>
          <dl className="info">
            {ev.address && (<><dt>Address</dt><dd>{ev.address}</dd></>)}
            <dt>When</dt>
            <dd>{dayLabel(ev.starts_at)} {clock(ev.starts_at)} – {clock(ev.ends_at)}</dd>
            <dt>Category</dt><dd>{ev.category}</dd>
            {ev.cover_charge && (<><dt>Cover</dt><dd>{ev.cover_charge}</dd></>)}
            {ev.age_rule && (<><dt>Ages</dt><dd>{ev.age_rule}</dd></>)}
            {ev.ticket_url && (<><dt>Tickets</dt><dd><a href={ev.ticket_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Get tickets</a></dd></>)}
            <dt>Saved by</dt><dd>{ev.save_count} {ev.save_count === 1 ? 'person' : 'people'}</dd>
          </dl>
          {ev.description && <p style={{ margin: '14px 0 0', color: 'var(--muted)' }}>{ev.description}</p>}
          {ev.is_demo && <p className="foot-note">Launch listing added by VIBES. Hours are approximate.</p>}
        </section>

        {(isOwner || isAdmin) && (
          <section className="panel owner">
            <h2>{isOwner ? 'Your event' : 'Admin'}</h2>
            {!confirmDel ? (
              <button className="btn gl danger" onClick={() => setConfirmDel(true)}><Icon name="trash" />Delete event</button>
            ) : (
              <>
                <p style={{ margin: '0 0 12px', fontSize: 14 }}>Delete “{ev.name}”? Its ratings, comments, photos and clips go with it. This can’t be undone.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn danger-solid"
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      const ok = await deleteEvent(ev.id);
                      setDeleting(false);
                      if (ok) router.replace('/');
                      else setConfirmDel(false);
                    }}
                  >
                    {deleting ? <span className="spin sm" /> : 'Yes, delete it'}
                  </button>
                  <button className="btn gl" disabled={deleting} onClick={() => setConfirmDel(false)}>Keep it</button>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      <div className="abar glass">
        <button className="btn hot" disabled={!activeNow} onClick={() => startRate(ev)}><Icon name="flame" />Rate the vibe</button>
        <button className="btn gl sq" disabled={!activeNow} onClick={() => openCapture(ev.id)} aria-label="Post a photo or clip"><Icon name="camera" /></button>
        {ev.lat != null && ev.lng != null && (
          <a className="btn gl sq" href={directionsUrl({ lat: ev.lat, lng: ev.lng })} target="_blank" rel="noopener noreferrer" aria-label="Get directions"><Icon name="nav" /></a>
        )}
        <button className="btn gl sq" aria-pressed={sv} onClick={() => toggleSave(ev.id)} aria-label={sv ? 'Remove from saved' : 'Save'}><Icon name="bookmark" fill /></button>
        <button className="btn gl sq" onClick={() => share(ev)} aria-label="Share"><Icon name="share" /></button>
      </div>
    </>
  );

  function ScoreBlock({ ev, s }: { ev: EventRow; s: Stats }) {
    if (now < Date.parse(ev.starts_at))
      return (
        <div>
          <div className="st fh" style={{ fontSize: 22, fontWeight: 700 }}>Starts {dayLabel(ev.starts_at).toLowerCase()} at {clock(ev.starts_at)}</div>
          <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>Ratings open when it starts. Save it to keep an eye on it.</p>
        </div>
      );
    if (now > Date.parse(ev.ends_at)) {
      const peak = peakWindow(rows[ev.id] ?? []);
      const final = s.conf === 'none' ? null : s.score >= SCORING.popAt ? STATUS.pop : s.score >= SCORING.midAt ? STATUS.mid : STATUS.dead;
      return (
        <div className="score">
          <div className="bignum" style={{ ['--c' as string]: final?.c ?? 'var(--quiet)' }}>{final ? s.score : '––'}</div>
          <div>
            <div className="st">{final ? `Final vibe: ${final.l}` : 'Not enough ratings to call it'}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>
              This event has ended.{peak && peak.count >= 3 ? ` Peak around ${clock(peak.start)}.` : ''}
            </div>
          </div>
        </div>
      );
    }
    if (!scored(s))
      return (
        <div className="score">
          <div className="bignum" style={{ ['--c' as string]: 'var(--quiet)' }}>––</div>
          <div>
            <div className="st">Not enough ratings yet</div>
            <div style={{ color: 'var(--muted)', fontSize: 13.5, marginTop: 4 }}>{plural(s.n, 'rating')} so far. If you’re here, your rating sets the tone.</div>
            <span className="conf">{CONF_LABEL[s.conf]}</span>
          </div>
        </div>
      );
    const t = STATUS[s.status];
    return (
      <div className="score">
        <div className="bignum" style={{ ['--c' as string]: t.c }}>{s.score}</div>
        <div>
          <div className="st" style={{ color: t.c }}>{t.l}</div>
          <div style={{ marginTop: 4 }}><MomText s={s} /></div>
          <span className={`conf ${s.conf}`}>{CONF_LABEL[s.conf]}</span>
        </div>
      </div>
    );
  }
}

function Comments({ ev }: { ev: EventRow }) {
  const { comments, now, helped, toggleHelpful, openReport, user } = useLive();
  const all = comments[ev.id] ?? [];
  const fresh = all.filter((c) => now - Date.parse(c.created_at) < 2 * 3_600_000);
  const old = all.filter((c) => now - Date.parse(c.created_at) >= 2 * 3_600_000);
  const one = (c: CommentRow, isOld: boolean) => {
    const name = c.profiles?.username ?? 'someone';
    const own = user?.id === c.user_id;
    return (
      <div className={`cmt ${isOld ? 'old' : ''}`} key={c.id}>
        <Avatar name={name} url={c.profiles?.avatar_url} />
        <div>
          <div className="ctop">
            <b>@{name}</b>
            <span className="ver">✓ Verified attendee</span>
            <span className="time">{ago(now - Date.parse(c.created_at))}</span>
          </div>
          <p>{c.body}</p>
          <div className="cact">
            {own ? (
              <span>{plural(c.helpful_count, 'helpful vote')}</span>
            ) : (
              <>
                <button aria-pressed={helped.has(c.id)} onClick={() => toggleHelpful(c)}>👍 Helpful {c.helpful_count}</button>
                <button onClick={() => openReport('comment', c.id, c.user_id, name)}>Report</button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  return (
    <section className="panel">
      <h2>What people are saying</h2>
      {!all.length ? (
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          {isActive(ev, now) ? 'No comments yet. If you’re here, say what it’s like in one sentence when you rate.' : 'No comments.'}
        </p>
      ) : (
        <>
          {fresh.map((c) => one(c, false))}
          {old.length > 0 && <div className="earlier">Earlier tonight, may not reflect right now</div>}
          {old.map((c) => one(c, true))}
        </>
      )}
    </section>
  );
}
