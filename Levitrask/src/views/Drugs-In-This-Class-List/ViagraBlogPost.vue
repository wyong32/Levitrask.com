<template>
  <div class="drug-info-page">
    <PageHeader />

    <main class="content-area">
      <SideNav
        class="side-nav-component"
        :sections="navSections"
        content-selector=".main-content > .tab-content"
      />

      <article class="main-content">
        <header class="drug-header">
          <h1>Viagra: A Detailed Look at Uses, Dosage, Side Effects, and Warnings</h1>
          <p>
            Viagra, a well-known medication, has gained worldwide recognition for its role in
            treating
            <router-link to="/blog/understanding-ed">erectile dysfunction (ED)</router-link>. But
            there's more to this little blue pill than its widespread fame. In this blog post, we'll
            take a detailed look at Viagra, including its official name, its uses, dosage
            guidelines, possible side effects, and important warnings.
          </p>
          <!-- Basic info -->
          <p><strong>Brand Name:</strong> Viagra</p>
          <p>
            <strong>Generic Name:</strong>
            <router-link to="/blog/sildenafil-generic-info">Sildenafil Citrate</router-link>
          </p>
          <p><strong>Drug Category:</strong> Phosphodiesterase type 5 (PDE5) Inhibitors</p>
        </header>

        <section id="what-is-viagra" class="tab-content">
          <h2>What is Viagra?</h2>
          <p>
            Viagra is a prescription medication primarily used to treat
            <router-link to="/blog/understanding-ed">erectile dysfunction (ED)</router-link>, a
            condition in which a man has difficulty achieving or maintaining an erection sufficient
            for sexual activity. It was developed by Pfizer and first approved by the U.S. Food and
            Drug Administration (FDA) in 1998. Since then, it has helped millions of men regain
            confidence in their sexual health.
          </p>
          <p>
            While Viagra is most commonly used for ED, it is also prescribed for other health issues
            like pulmonary arterial hypertension (PAH), a type of high blood pressure in the lungs.
          </p>
        </section>

        <section id="how-it-works" class="tab-content">
          <h2>How Does Viagra Work?</h2>
          <p>
            Viagra works by increasing blood flow to the penis, helping men achieve and maintain an
            erection when sexually stimulated. It does this by inhibiting an enzyme called
            phosphodiesterase type 5 (PDE5), which can restrict blood flow. By blocking this enzyme,
            Viagra helps relax the blood vessels in the penis, facilitating a better erection.
          </p>
          <p>
            It's important to note that Viagra does not work without sexual stimulation. It merely
            helps the body respond to sexual arousal.
          </p>
        </section>

        <section id="how-to-use" class="tab-content">
          <h2>How to Use Viagra</h2>
          <p>
            Viagra should be taken as prescribed by a doctor. It comes in tablet form and is
            typically taken about 30 minutes to an hour before sexual activity. It can be taken with
            or without food, though high-fat meals might delay its effectiveness.
          </p>
          <h3>Typical Dosage:</h3>
          <ul>
            <li>
              <strong>Initial Dose:</strong> For most men, the recommended starting dose is 50 mg.
              This may be adjusted based on individual response and tolerability.
            </li>
            <li>
              <strong>Maximum Dose:</strong> The maximum recommended dose is 100 mg, taken once per
              day.
            </li>
            <li>
              <strong>Minimum Dose:</strong> For those who experience side effects, a lower dose of
              25 mg may be prescribed.
            </li>
          </ul>
          <p>
            The effects of Viagra can last for up to 4-5 hours, but this can vary from person to
            person. It's essential not to take more than one dose in a 24-hour period. Remember that
            certain
            <router-link to="/blog/lifestyle-impact">lifestyle factors</router-link>
            can also influence how well ED medications work.
          </p>
        </section>

        <section id="side-effects" class="tab-content">
          <h2>Side Effects of Viagra</h2>
          <p>
            Like any medication, Viagra can cause side effects, although they are not guaranteed to
            happen. Common side effects include:
          </p>
          <h3>Common Side Effects:</h3>
          <ul>
            <li>Headache</li>
            <li>Flushing (warmth or redness in the face)</li>
            <li>Indigestion (dyspepsia)</li>
            <li>Nasal congestion</li>
            <li>Dizziness</li>
            <li>Visual disturbances (e.g., changes in color vision or blurred vision)</li>
          </ul>
          <h3>Serious Side Effects (Seek Medical Attention):</h3>
          <p>In rare cases, Viagra can cause more serious side effects, including:</p>
          <ul>
            <li>Priapism (a prolonged and painful erection lasting more than 4 hours)</li>
            <li>Sudden loss of vision or changes in vision</li>
            <li>Hearing loss or ringing in the ears (tinnitus)</li>
            <li>Chest pain or irregular heartbeat</li>
          </ul>
          <p>
            If you experience any of these serious side effects, you should seek medical attention
            immediately. For guidance on handling common side effects, check our post on
            <router-link to="/blog/managing-side-effects"
              >managing ED medication side effects</router-link
            >.
          </p>
        </section>

        <section id="warnings" class="tab-content">
          <h2>Warnings and Precautions</h2>
          <p>
            Before using Viagra, it's important to discuss your medical history and any other
            medications you may be taking with your healthcare provider. Certain conditions or
            medications can interact with Viagra or make it unsafe to use.
          </p>
          <h3>Contraindications:</h3>
          <ul>
            <li>
              <strong>Nitrate Medications:</strong> Viagra should not be used with any form of
              nitrate medication (often prescribed for chest pain or heart issues) as the
              combination can cause a dangerous drop in blood pressure.
            </li>
            <li>
              <strong>Severe Heart or Liver Problems:</strong> If you have heart disease, have had a
              recent heart attack, or suffer from severe liver issues, Viagra may not be suitable.
            </li>
            <li>
              <strong>Kidney Disease:</strong> If you have kidney issues, your doctor may need to
              adjust your dose.
            </li>
          </ul>
          <h3>Alcohol Use:</h3>
          <p>
            Drinking alcohol can increase the likelihood of side effects such as dizziness or
            headaches. It's advisable to limit alcohol consumption when taking Viagra.
          </p>
          <h3>Older Adults:</h3>
          <p>
            Older men (especially those over 65) may need a lower dose of Viagra, as they are more
            likely to experience side effects or slower metabolism of the drug. Always
            <router-link to="/blog/talking-to-doctor-ed"
              >discuss your health profile with your doctor</router-link
            >
            before starting any new medication.
          </p>
        </section>
        <section id="other-considerations" class="tab-content">
          <h2>Other Considerations</h2>
          <h3>Not for Women or Children:</h3>
          <p>
            Viagra is not approved for use in women or children. Its effects on women's sexual
            health have not been studied sufficiently, and it should only be used as directed for
            male erectile dysfunction.
          </p>
          <h3>Impact on Mental Health:</h3>
          <p>
            While Viagra is not known to directly affect mental health, erectile dysfunction itself
            can lead to feelings of anxiety, depression, or low self-esteem. Using Viagra can help
            improve self-confidence and alleviate some of these concerns.
          </p>
        </section>

        <section id="generic-drugs" class="tab-content">
          <h2>Generic Drugs (Sildenafil)</h2>
          <p>
            Generic Viagra, containing
            <router-link to="/blog/sildenafil-generic-info">Sildenafil Citrate</router-link>, is
            widely available and often provides a more cost-effective option for treating ED. As
            with the brand name, a prescription is required.
          </p>
          <p><strong>Explore More on ED Drugs:</strong></p>
          <ul>
            <li>
              <router-link to="/blog/generic-vs-brand-deep-dive"
                >Generic vs. Brand Name: Key Differences Explained</router-link
              >
            </li>
            <li>
              <router-link to="/blog/tadalafil-generic-faq"
                >Generic Cialis (Tadalafil) FAQ</router-link
              >
            </li>
            <li>
              <router-link to="/blog/vardenafil-generic-info"
                >Generic Levitra (Vardenafil) Information</router-link
              >
            </li>
            <li>
              <router-link to="/blog/avanafil-patient-guide"
                >Generic Stendra (Avanafil): Patient Guide</router-link
              >
            </li>
            <li>
              <router-link to="/blog/saving-on-ed-meds"
                >Tips for Saving Money on ED Medication</router-link
              >
            </li>
            <li>
              <router-link to="/blog/comparing-factors"
                >Comparing Different ED Treatment Options</router-link
              >
            </li>
          </ul>
        </section>

        <section id="conclusion" class="tab-content">
          <h2>Conclusion</h2>
          <p>
            Viagra is a powerful and effective medication that has helped millions of men improve
            their sexual health. However, like any medication, it's important to use it responsibly
            and under the supervision of a healthcare provider. Be sure to follow your doctor's
            instructions regarding dosage and frequency, and always report any unusual side effects
            or reactions.
          </p>
          <p>
            If you're struggling with
            <router-link to="/blog/understanding-ed">erectile dysfunction</router-link>, don't
            hesitate to
            <router-link to="/blog/talking-to-doctor-ed">speak with your doctor</router-link>.
            Viagra could be the solution that helps you regain your confidence and improve your
            quality of life.
          </p>
        </section>
      </article>

      <DrugSidebar class="drug-sidebar-component" :sidebarData="viagraSidebarData" />
    </main>

    <PageFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue' // Adjusted path
import PageFooter from '../../components/PageFooter.vue' // Adjusted path
import SideNav from '../../components/SideNav.vue' // Adjusted path
import DrugSidebar from '../../components/DrugSidebar.vue' // Adjusted path

// Updated nav sections based on the provided content
const navSections = ref([
  { id: 'what-is-viagra', title: 'What is Viagra?' },
  { id: 'how-it-works', title: 'How It Works' },
  { id: 'how-to-use', title: 'How to Use & Dosage' }, // Combined for brevity
  { id: 'side-effects', title: 'Side Effects' },
  { id: 'warnings', title: 'Warnings & Precautions' },
  { id: 'other-considerations', title: 'Other Considerations' },
  { id: 'generic-drugs', title: 'Generic Drugs' }, // Added Generic Drugs section
  { id: 'conclusion', title: 'Conclusion' },
])

// Updated sidebar data based on provided content
const viagraSidebarData = ref({
  drugStatus: {
    availability: { text: 'Available', statusClass: 'status-active' },
    details: 'Prescription only; generic (Sildenafil) available',
    pregnancyLactation: 'Not indicated for women; Risk in PAH use',
    approvalHistory: 'FDA Approved 1998',
  },
  quickSummary: {
    formsStrengths:
      '<br/>Tablets: <br/>Viagra 25mg <br/>Viagra 50mg <br/> Viagra100mg (Also Revatio for PAH)',
    reminders: [
      'Take 30-60 mins before activity.',
      'Do NOT take with nitrates.',
      'Effects last up to 4-5 hours.',
      'Max one dose per day.',
      'Report prolonged erections (>4 hrs).',
    ],
  },
  drugImage: {
    src: '/images/Viagra-01.jpg', // Keep or replace image
    alt: 'Viagra (Sildenafil) 100mg pills',
  },
  relatedResources: [
    { text: 'Understanding Erectile Dysfunction (ED)', to: '/blog/understanding-ed' }, // Existing blog
    { text: 'Managing Side Effects of ED Medications', to: '/blog/managing-side-effects' }, // New blog
    { text: 'Sildenafil (Generic Viagra): What to Expect', to: '/blog/sildenafil-generic-info' }, // New blog
    { text: 'Lifestyle Factors Affecting ED', to: '/blog/lifestyle-impact' }, // Existing blog
    { text: 'FDA Drug Information: Sildenafil', to: '/blog/fda-sildenafil-info' }, // New blog
  ],
  similarDrugs: [
    { text: 'Cialis (tadalafil)', to: '/Cialis' }, // Updated path
    { text: 'Levitra (vardenafil)', to: '/' }, // Path to Levitra (Index) remains '/'
    { text: 'Stendra (avanafil)', to: '/Stendra' }, // Updated path
  ],
  drugComparison: [
    { text: 'Viagra vs Levitra', to: '/Levitra-vs-Viagra' },
    { text: 'Viagra vs Cialis', to: '/Cialis-vs-Viagra' },
    { text: 'Viagra vs Stendra', to: '/Stendra-vs-Viagra' },
    // Add other comparison links (e.g., Cialis, Stendra)
  ],
})
</script>

<style scoped>
/* Styles are copied/adapted from IndexView.vue */
/* 移除 html 的 scroll-behavior，因为我们用 JS 控制 */
/* html { */
/*  scroll-behavior: smooth; */
/* } */

/* 给内容区域添加上边距，防止跳转时标题被顶部导航遮挡 */
.tab-content {
  scroll-margin-top: 100px;
  line-height: 1.7;
  padding-top: 1rem;
  margin-bottom: 2rem;
}

.drug-info-page {
  font-family: sans-serif;
  color: #333;
}

/* 内容区域布局: 左导航(1), 主内容(5), 右侧边栏(1.5) */
.content-area {
  display: flex;
  padding: 2rem 0;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 主内容区 */
.main-content {
  flex: 5;
}

.drug-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

/* 药品标题 */
.drug-header h1 {
  margin-bottom: 1rem;
  color: #343a40;
  font-size: 2rem;
  line-height: 1.3;
}
.drug-header p {
  margin-bottom: 0.5rem;
  color: #555;
}
.drug-header p strong {
  color: #343a40;
}

/* 标签内容 */
.tab-content h2 {
  margin-bottom: 1rem;
  color: #343a40;
  font-size: 1.6rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}
.main-content > .tab-content:first-of-type h2 {
  margin-top: 0;
}
.tab-content h3 {
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
  font-size: 1.3rem;
  color: #495057;
}
.tab-content ul {
  padding-left: 25px;
  margin-bottom: 1rem;
  list-style-type: disc;
}
.tab-content li {
  margin-bottom: 0.6rem;
}
.tab-content strong {
  color: #343a40;
}

/* 提示信息样式 */
.alert-info {
  background-color: #e7f3fe;
  border-left: 4px solid #2196f3;
  padding: 12px 20px;
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.alert-info p {
  margin: 0;
  color: #1d5a7a;
  font-size: 0.9rem;
}

/* Sidebar list styling (basic) */
.sidebar-section ul {
  padding-left: 20px;
  margin-top: 0.5rem;
}

.sidebar-section li {
  margin-bottom: 0.4rem;
}

.sidebar-section a {
  color: #007bff;
  text-decoration: none;
  font-size: 0.9rem;
}
.sidebar-section a:hover {
  text-decoration: underline;
}

/* Adjust spacing if needed */
.sidebar-section.quick-summary ul {
  list-style: disc; /* Use standard bullets for reminders */
}

/* PageHeader, PageFooter, SideNav, DrugSidebar styles are in their respective components */

/* Optional: Add styles for inline links if needed */
.main-content a {
  color: #007bff; /* Match sidebar link color */
  text-decoration: none;
}

.main-content a:hover {
  text-decoration: underline;
}

/* --- Responsive Styles --- */

/* Tablet (Optional adjustments, can be refined later) */
@media (min-width: 769px) and (max-width: 1024px) {
  .content-area {
    gap: 1.5rem; /* Reduce gap slightly */
    padding: 1.5rem 1rem; /* Adjust padding */
  }
  /* Optionally adjust flex basis or width of sidebars if needed */
}

/* Mobile (Hide left nav, stack main and right sidebar) */
@media (max-width: 768px) {
  .content-area {
    flex-direction: column; /* Stack items vertically */
    padding: 1rem; /* Adjust padding for mobile */
    gap: 1.5rem; /* Adjust gap for vertical stacking */
  }

  /* Hide the SideNav component */
  /* Using :deep() as fallback just in case class targeting fails */
  .content-area > :deep(aside:first-of-type),
  .content-area > .side-nav-component {
    /* Target added class */
    display: none;
  }

  /* Allow main content and right sidebar to take full width */
  .main-content {
    flex: 1; /* Reset flex basis for column layout */
    order: 1; /* Ensure main content is first */
  }

  /* Target DrugSidebar */
  /* Using :deep() as fallback just in case class targeting fails */
  .content-area > :deep(aside:last-of-type),
  .content-area > .drug-sidebar-component {
    /* Target added class */
    flex: 1; /* Reset flex basis */
    width: 100%; /* Ensure it takes full width */
    order: 2; /* Place it after main content */
  }
}
</style> 