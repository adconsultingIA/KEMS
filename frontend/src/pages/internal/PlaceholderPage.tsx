type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">KEMS</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <section className="panel empty-panel">
        <strong>Fondation prête</strong>
        <p>
          Cette brique sera développée progressivement
          dans les prochains jalons.
        </p>
      </section>
    </div>
  )
}
