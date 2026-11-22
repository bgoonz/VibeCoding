import { profile } from "@/data/profile";

export default function Home() {
  return (
    <div className="page">
      <header className="nav">
        <a className="brand" href="#top">
          Bryan Guner
        </a>
        <nav aria-label="Page">
          <ul className="nav-links">
            <li>
              <a href="#experience">Experience</a>
            </li>
            <li>
              <a href="#skills">Skills</a>
            </li>
            <li>
              <a href="#education">Education</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <p className="kicker">Web developer · {profile.location}</p>
            <h1>{profile.name}</h1>
            <p className="role">{profile.title}</p>
          </div>
          <div>
            <p className="lede">{profile.summary}</p>
            <div className="actions">
              {profile.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" aria-labelledby="experience-heading">
          <h2 id="experience-heading">Experience</h2>
          {profile.experience.map((job) => (
            <article className="job" key={`${job.company}-${job.dates}`}>
              <div>
                <p className="when">{job.dates}</p>
                <p className="where">{job.place}</p>
              </div>
              <div>
                <h3>{job.role}</h3>
                <p className="company">{job.company}</p>
                {job.points.length > 0 ? (
                  <ul>
                    {job.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
                {job.stack.length > 0 ? (
                  <ul className="stack" aria-label={`${job.company} stack`}>
                    {job.stack.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section id="skills" aria-labelledby="skills-heading">
          <h2 id="skills-heading">Skills</h2>
          <dl>
            <div className="skill-row">
              <dt>Top skills</dt>
              <dd>{profile.skills.join(" · ")}</dd>
            </div>
            <div className="skill-row">
              <dt>Also used in the work</dt>
              <dd>{profile.toolkit.join(" · ")}</dd>
            </div>
          </dl>
        </section>

        <section id="education" aria-labelledby="education-heading">
          <h2 id="education-heading">Education</h2>
          <div className="schools">
            {profile.education.map((school) => (
              <article className="school" key={school.school}>
                <h3>{school.school}</h3>
                <p>{school.detail}</p>
                <p>{school.dates}</p>
              </article>
            ))}
          </div>
          <div className="facts-grid">
            <article className="fact-card">
              <h3>Certification</h3>
              <p>{profile.certification}</p>
            </article>
            <article className="fact-card">
              <h3>Award</h3>
              <p>{profile.award}</p>
            </article>
            <article className="fact-card">
              <h3>Publication</h3>
              <p>{profile.publication}</p>
            </article>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-heading">
          <h2 id="contact-heading">Contact</h2>
          <div className="contact">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.phoneHref}>{profile.phone}</a>
            <a href={profile.links[1].href}>LinkedIn</a>
            <a href={profile.links[2].href}>GitHub</a>
          </div>
        </section>
      </main>

      <footer>
        <span>Bryan Guner</span>
        <span>{profile.location}</span>
      </footer>
    </div>
  );
}
