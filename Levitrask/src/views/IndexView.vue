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
          <h1>Levitra: A Comprehensive Overview of the Medication</h1>
          <p><strong>Common Brand Name(s):</strong> Staxyn, Levitra</p>
          <p>
            <strong>Common Generic Name(s):</strong> vardenafil, vardenafil HCl, vardenafil
            hydrochloride
          </p>
          <p><strong>Pronunciation: </strong> var-DEN-a-fil</p>
          <p><strong>Drug Class:</strong> Phosphodiesterase-5 (PDE5) inhibitor</p>
          <p><strong>Availability:</strong> Prescription only; generic available</p>
          <!-- How is it used? - integrated into text -->
        </header>

        <section id="what-is-levitra" class="tab-content">
          <h2>What is Levitra?</h2>
          <p>
            Levitra is a prescription medication used to treat
            <router-link to="/blog/understanding-ed">erectile dysfunction (ED)</router-link> in
            adult men. ED is a common condition characterized by the inability to achieve or
            maintain an erection sufficient for satisfactory sexual performance. Levitra contains
            the active ingredient
            <router-link to="/blog/vardenafil-generic-info">vardenafil</router-link>, which enhances
            blood flow to the penis by relaxing smooth muscle tissue and inhibiting the PDE5 enzyme.
          </p>
          <p>
            Levitra is taken on an as-needed basis before sexual activity. It typically takes effect
            within 30 to 60 minutes, and its duration of action can last up to 4-5 hours. Sexual
            stimulation is still required for Levitra to work—it does not cause an erection on its
            own.
          </p>
          <img
            src="/images/index-01.webp"
            alt="Image illustrating the use or effects of Levitra (vardenafil)"
            style="
              max-width: 100%;
              height: auto;
              margin: 1.5rem 0;
              border-radius: 8px;
              display: block;
            "
          />
        </section>

        <section id="how-to-use" class="tab-content">
          <h2>How to Use Levitra</h2>
          <p>
            Levitra is available as an oral tablet or as an orally disintegrating tablet (Staxyn).
            Use it exactly as directed by your healthcare provider.
          </p>
          <ul>
            <li>
              <strong>Starting dose:</strong> 10 mg, taken about 30 to 60 minutes before sexual
              activity.
            </li>
            <li><strong>Maximum dose:</strong> 20 mg per 24 hours.</li>
            <li>
              <strong>Minimum dose:</strong> 5 mg (for individuals with increased sensitivity or
              certain medical conditions).
            </li>
            <li>
              <strong>With or without food:</strong> It can be taken with meals, but high-fat meals
              may delay its onset of action.
            </li>
            <li>Do not take more than once per day.</li>
          </ul>
          <p>
            <strong>Tip:</strong> Taking Levitra on an empty stomach may result in quicker effects.
          </p>
        </section>

        <section id="before-taking" class="tab-content">
          <h2>Before Taking Levitra</h2>
          <p>
            Before using Levitra, discuss your full medical history with your doctor, including any
            allergies, medications, or chronic health issues. Do not take Levitra if you:
          </p>
          <ul>
            <li>Are allergic to vardenafil or any of the ingredients in Levitra.</li>
            <li>
              Are taking nitrate medications or nitric oxide donors (often used for chest pain).
            </li>
            <li>Have had recent heart problems (heart attack, stroke, or severe arrhythmia).</li>
            <li>Suffer from serious liver or kidney disease.</li>
            <li>Have low blood pressure or uncontrolled high blood pressure.</li>
            <li>Have inherited eye diseases such as retinitis pigmentosa.</li>
          </ul>
          <p>
            Also inform your doctor if you are taking any other medications, including herbal
            supplements, as drug interactions can occur.
          </p>
        </section>

        <section id="side-effects" class="tab-content">
          <h2>levitra side effects</h2>
          <p>
            Like any medication, Levitra may cause side effects. Most are mild and temporary, but
            some can be serious.
          </p>
          <h3>Common side effects include:</h3>
          <ul>
            <li>Headache</li>
            <li>Flushing (warmth or redness in the face)</li>
            <li>Stuffy or runny nose</li>
            <li>Upset stomach</li>
            <li>Dizziness</li>
            <li>Back or muscle pain (less common)</li>
          </ul>
          <h3>Serious side effects may include:</h3>
          <ul>
            <li>Sudden vision loss in one or both eyes</li>
            <li>Hearing loss or ringing in the ears</li>
            <li>Chest pain or irregular heartbeat</li>
            <li>Shortness of breath or swelling in the legs</li>
            <li>Priapism (painful erection lasting more than 4 hours)</li>
            <li>Allergic reactions (rash, itching, facial swelling, difficulty breathing)</li>
          </ul>
          <p>
            If any serious side effects occur, stop taking Levitra and seek emergency medical
            attention. For tips on handling common side effects, see our article on
            <router-link to="/blog/managing-side-effects"
              >managing ED medication side effects</router-link
            >.
          </p>
        </section>

        <section id="drug-interactions" class="tab-content">
          <h2>Drug Interactions</h2>
          <p>
            Levitra can interact with several medications, which may affect how it works or increase
            the risk of side effects. Important interactions include:
          </p>
          <ul>
            <li>
              <strong>Nitrates (e.g., nitroglycerin):</strong> Can cause life-threatening drops in
              blood pressure.
            </li>
            <li>
              <strong>Antifungal medications (e.g., ketoconazole, itraconazole):</strong> May
              increase Levitra levels in the blood.
            </li>
            <li>
              <strong>HIV protease inhibitors (e.g., ritonavir, saquinavir):</strong> May require
              dose adjustment.
            </li>
            <li>
              <strong>Alpha-blockers (e.g., doxazosin):</strong> May enhance hypotensive effects.
            </li>
          </ul>
          <p>Always provide a full list of medications to your doctor before using Levitra.</p>
        </section>

        <section id="comparison" class="tab-content">
          <h2>Levitra Compared to Other ED Medications</h2>
          <p>
            There are several other PDE5 inhibitors available to treat ED, including
            <router-link to="/Viagra">Viagra (sildenafil)</router-link>,
            <router-link to="/Cialis">Cialis (tadalafil)</router-link>, and
            <router-link to="/Stendra">Stendra (avanafil)</router-link>. Each has unique
            characteristics. Here's a detailed comparison to help understand how Levitra stands
            apart:
          </p>
          <h3>📊 Comparison Table: Levitra vs. Cialis, Viagra, Stendra</h3>
          <div class="comparison-table-container">
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th><router-link to="/">Levitra (vardenafil)</router-link></th>
                  <th><router-link to="/Viagra">Viagra (sildenafil)</router-link></th>
                  <th><router-link to="/Cialis">Cialis (tadalafil)</router-link></th>
                  <th><router-link to="/Stendra">Stendra (avanafil)</router-link></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Onset of Action</td>
                  <td>30–60 minutes</td>
                  <td>30–60 minutes</td>
                  <td>~30 minutes (as fast as 15)</td>
                  <td>15-30 minutes</td>
                </tr>
                <tr>
                  <td>Duration of Effect</td>
                  <td>4-5 hours</td>
                  <td>~4 hours</td>
                  <td>Up to 36 hours</td>
                  <td>~6 hours</td>
                </tr>
                <tr>
                  <td>Food Impact</td>
                  <td>High-fat meals may delay effect</td>
                  <td>High-fat meals reduce absorption</td>
                  <td>Little to no impact</td>
                  <td>Minimal impact</td>
                </tr>
                <tr>
                  <td>Starting Dose</td>
                  <td>levitra 10 mg</td>
                  <td>Viagra 50 mg</td>
                  <td>Cialis 10 mg</td>
                  <td>Stendra 100 mg</td>
                </tr>
                <tr>
                  <td>Maximum Dose</td>
                  <td>levitra 20 mg</td>
                  <td>Viagra 100 mg</td>
                  <td>Cialis 20 mg</td>
                  <td>Stendra 200 mg</td>
                </tr>
                <tr>
                  <td>Common Side Effects</td>
                  <td>Headache, nasal congestion, flushing</td>
                  <td>Headache, flushing, vision changes</td>
                  <td>Back pain, muscle aches, headache</td>
                  <td>Headache, flushing, nasal congestion</td>
                </tr>
                <tr>
                  <td>Visual Side Effects</td>
                  <td>Rare</td>
                  <td>More common (blue-tinted vision)</td>
                  <td>Rare</td>
                  <td>Very rare</td>
                </tr>
                <tr>
                  <td>Best Use Case</td>
                  <td>Fast onset with fewer visual effects</td>
                  <td>General use, budget-friendly</td>
                  <td>Long-lasting flexibility</td>
                  <td>Quick action, newer option</td>
                </tr>
                <tr>
                  <td>Daily Use Option</td>
                  <td>No</td>
                  <td>No</td>
                  <td>Yes (2.5 mg or 5 mg daily)</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Inserted Second Image -->
          <img
            src="/images/index-02.webp"
            alt="Visual representation related to Levitra or ED treatment options"
            style="
              max-width: 100%;
              height: auto;
              margin: 1.5rem 0;
              border-radius: 8px;
              display: block;
            "
          />
        </section>

        <section id="choosing-medication" class="tab-content">
          <h2>Choosing the Right Medication</h2>
          <p>When selecting the most appropriate ED medication, consider:</p>
          <ul>
            <li>
              How frequently you expect to have sex –
              <router-link to="/Cialis">Cialis</router-link> is ideal for spontaneous, frequent
              encounters.
            </li>
            <li>
              How quickly you want it to work –
              <router-link to="/Stendra">Stendra</router-link> works the fastest.
            </li>
            <li>
              How long you want effects to last –
              <router-link to="/Cialis">Cialis</router-link> offers the longest duration.
            </li>
            <li>
              Tolerance and sensitivity to side effects – Levitra may be better tolerated if you're
              prone to visual disturbances.
            </li>
            <li>Other medications or health conditions – Always consult your doctor for safety.</li>
          </ul>
        </section>

        <section id="generic-drugs" class="tab-content">
          <h2>Generic Levitra (Vardenafil)</h2>
          <p>
            Levitra's active ingredient,
            <router-link to="/blog/vardenafil-generic-info">vardenafil</router-link>, is available
            in a generic form. Generic medications contain the same active ingredients and work the
            same way as their brand-name counterparts but are typically available at a lower cost.
          </p>
          <p>Key points about generic vardenafil:</p>
          <ul>
            <li>
              <strong>Same Effectiveness:</strong> Offers the same efficacy and safety profile as
              brand-name Levitra.
            </li>
            <li>
              <strong>Cost Savings:</strong> Usually significantly cheaper than the brand-name
              version.
            </li>
            <li>
              <strong>Availability:</strong> Widely available with a prescription. Brand Levitra has
              been discontinued in the US, making generic vardenafil the primary option.
            </li>
          </ul>
          <p>
            Choosing between generic and brand-name drugs often comes down to cost and availability.
            Discuss with your doctor if generic vardenafil is a suitable option for you. You can
            find more detailed information in our
            <router-link to="/blog/levitra-generic-drugs">article on generic Vardenafil</router-link
            >.
          </p>

          <!-- Swiper replaces the old grid here -->
          <div class="swiper-container-wrapper related-generics-swiper-container">
            <!-- Swiper -->
            <div class="swiper related-generics-swiper">
              <div class="swiper-wrapper">
                <!-- Slide 1: Original Item A, Restyled -->
                <div class="swiper-slide">
                  <div class="related-generic-item">
                    <h3>Viagra Professional buy online</h3>
                    <p>
                      Brand Levitra is a modern pharmaceutical product created to cure male
                      impotence.
                    </p>
                    <router-link to="/Buy-Levitra-Online" class="view-more-button">
                      View more
                    </router-link>
                  </div>
                </div>
                <div class="swiper-slide">
                  <div class="related-generic-item">
                    <h3>Levitra Soft buy online</h3>
                    <p>
                      Levitra Soft is a generic manufactured by well-known Indian medicine concern
                      Sunrise Remedies.
                    </p>
                    <router-link to="/Buy-Levitra-Online" class="view-more-button">
                      View more
                    </router-link>
                  </div>
                </div>
                <div class="swiper-slide">
                  <div class="related-generic-item">
                    <h3>Levitra Professional buy online</h3>
                    <p>
                      Levitra Professional is an excellent choice for those who like Levitra, but do
                      not like its characteristic slightly bitter taste.
                    </p>
                    <router-link to="/Buy-Levitra-Online" class="view-more-button">
                      View more
                    </router-link>
                  </div>
                </div>
                <div class="swiper-slide">
                  <div class="related-generic-item">
                    <h3>Super Vilitra buy online</h3>
                    <p>
                      Levitra with Dapoxetine is a newly developed, highly effective pharmaceutical
                      product
                    </p>
                    <router-link to="/Buy-Levitra-Online" class="view-more-button">
                      View more
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
            <!-- Navigation Buttons -->
            <div class="swiper-button-prev related-generics-prev"></div>
            <div class="swiper-button-next related-generics-next"></div>
          </div>

          <!-- Added Important Note and Disclaimer -->
          <p style="margin-top: 1.5rem; font-size: 0.9em; color: #555">
            <strong>Important:</strong> Non-FDA-approved generics like Vilitra or Zhewitra may not
            adhere to the same quality control standards. Prioritize FDA-approved generic vardenafil
            from verified pharmacies when possible.
          </p>
          <p style="font-size: 0.9em; color: #555">
            <strong>Disclaimer:</strong> Mentioning product names is for informational purposes
            only. We are not responsible for transactions or products from third-party websites.
            Purchase online with caution.
          </p>
          <!-- End Added Note and Disclaimer -->
        </section>

        <section id="conclusion" class="tab-content">
          <h2>Conclusion: Is Levitra Right for You?</h2>
          <p>
            Levitra is a highly effective and well-tolerated medication for treating erectile
            dysfunction. Its quick onset, moderate duration, and relatively low risk of visual side
            effects make it a strong option for many men. You can learn more about the active
            ingredient, <router-link to="/blog/vardenafil-generic-info">vardenafil</router-link>,
            here. However, the right ED medication depends on personal needs, health status, and
            individual response.
          </p>
          <p>
            Before starting Levitra, have an open
            <router-link to="/blog/talking-to-doctor-ed"
              >conversation with your healthcare provider</router-link
            >
            to ensure it's the safest and most effective choice for your situation.
          </p>
        </section>
      </article>

      <DrugSidebar :sidebarData="levitraSidebarData" />
    </main>

    <PageFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import PageFooter from '../components/PageFooter.vue'
import SideNav from '../components/SideNav.vue'
import DrugSidebar from '../components/DrugSidebar.vue'

// Import Swiper Vue.js components and styles
import Swiper from 'swiper'
import { Navigation } from 'swiper/modules' // Import Navigation module
import 'swiper/css'
import 'swiper/css/navigation' // Import navigation styles

// Updated nav sections based on the new content
const navSections = ref([
  { id: 'what-is-levitra', title: 'What is Levitra?' },
  { id: 'how-to-use', title: 'How to Use' },
  { id: 'before-taking', title: 'Before Taking' },
  { id: 'side-effects', title: 'Side Effects' },
  { id: 'drug-interactions', title: 'Drug Interactions' },
  { id: 'comparison', title: 'Drug Comparison' },
  { id: 'choosing-medication', title: 'Choosing Medication' },
  { id: 'generic-drugs', title: 'Generic Drugs' },
  { id: 'conclusion', title: 'Conclusion' },
])

// Sidebar data remains largely the same, but could be updated
const levitraSidebarData = ref({
  drugStatus: {
    availability: { text: 'Generic Available', statusClass: 'status-active' },
    details: '(Brand Levitra discontinued US; Prescription required)',
    pregnancyLactation: 'Not indicated for women',
    approvalHistory: 'Generic Vardenafil FDA approved',
  },
  quickSummary: {
    formsStrengths:
      '<br />Oral Tablet: <br />Levitra 2.5mg <br>Levitra 5mg <br />Levitra 10mg <br />Levitra 20mg',
    reminders: [
      'Take 30-60 mins before activity.',
      'Do NOT take with nitrates.',
      'Effects last up to 4-5 hours.',
      'High-fat meals may delay onset.',
      'Report prolonged erections (>4 hrs).',
    ],
  },
  drugImage: {
    src: '/images/levitrask-01.jpg',
    alt: 'Levitra 20mg pill image',
    caption: 'Image of a Levitra 20mg tablet.',
  },
  relatedResources: [
    { text: 'Vardenafil (Generic): Uses & Side Effects', to: '/blog/vardenafil-generic-info' },
    { text: 'FDA Drug Information: Vardenafil', to: '/blog/fda-vardenafil-info' },
    { text: 'Understanding Erectile Dysfunction (ED)', to: '/blog/understanding-ed' },
    { text: 'Tips for Discussing ED with Your Doctor', to: '/blog/talking-to-doctor-ed' },
  ],
  similarDrugs: [
    { text: 'Cialis (tadalafil)', to: '/Cialis' },
    { text: 'Stendra (avanafil)', to: '/Stendra' },
    { text: 'Viagra (sildenafil)', to: '/Viagra' },
  ],
  drugComparison: [
    { text: 'Levitra vs Viagra', to: '/Levitra-vs-Viagra' },
    { text: 'Levitra vs Cialis', to: '/Levitra-vs-Cialis' },
    { text: 'Levitra vs Stendra', to: '/Levitra-vs-Stendra' },
  ],
  frequentlyAskedQuestions: [
    {
      text: 'Why Is Levitra No Longer Available?',
      to: { name: 'question-details', params: { id: 'Levitra-No-Longer-Available' } },
    },
    {
      text: 'How To Make Levitra More Effective',
      to: { name: 'question-details', params: { id: 'Make-Levitra-More-Effective' } },
    },
    {
      text: 'Is Levitra Better Than Viagra',
      to: { name: 'question-details', params: { id: 'Is-Levitra-Better-Than-Viagra' } },
    },
    {
      text: 'How Long Does Levitra Last',
      to: { name: 'question-details', params: { id: 'How-Long-Does-Levitra-Last' } },
    },
    {
      text: 'What Is Levitra Used For',
      to: { name: 'question-details', params: { id: 'What-Is-Levitra-Used-For' } },
    },
    {
      text: 'Is Levitra Stronger Than Viagra?',
      to: { name: 'question-details', params: { id: 'Is-Levitra-Stronger-Than-Viagra' } },
    },
    {
      text: 'Can You Still Buy Levitra?',
      to: { name: 'question-details', params: { id: 'Can-You-Still-Buy-Levitra' } },
    },
    {
      text: 'What Does Levitra Do To a Man?',
      to: { name: 'question-details', params: { id: 'What-Does-Levitra-Do-To-A-Man' } },
    },
  ],
})

// Initialize Swiper when component is mounted
onMounted(() => {
  nextTick(() => {
    const swiper = new Swiper('.related-generics-swiper', {
      // Optional parameters
      modules: [Navigation],
      loop: false,
      slidesPerView: 3,
      spaceBetween: 20,
      navigation: {
        nextEl: '.related-generics-next',
        prevEl: '.related-generics-prev',
      },
    })
  })
})
</script>

<style scoped>
/* 移除 html 的 scroll-behavior，因为我们用 JS 控制 */
/* html { */
/*  scroll-behavior: smooth; */
/* } */

/* 给内容区域添加上边距，防止跳转时标题被顶部导航遮挡 */
.tab-content {
  scroll-margin-top: 100px;
  line-height: 1.7;
  padding-top: 1rem;
  margin-bottom: 1.5rem;
}

.drug-info-page {
  font-family: sans-serif;
  color: #333;
}

/* 页眉样式 - 已移至 PageHeader.vue */
/* .page-header { ... } */
/* .logo { ... } */
/* .main-nav a { ... } */

/* 内容区域布局: 左导航(1), 主内容(5), 右侧边栏(1.5) */
.content-area {
  display: flex;
  padding: 2rem 0;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 左侧固定导航栏 - 样式已移至 SideNav.vue */
/* .side-nav { ... } */
/* .side-nav .tab { ... } */
/* .side-nav .tab:hover { ... } */
/* .side-nav .tab.active { ... } */

/* 主内容区 */
.main-content {
  flex: 5;
}

/* 右侧边栏 - 样式已移至 DrugSidebar.vue */
/* .sidebar { ... } */

.drug-header {
  margin-bottom: 2rem;
}

/* 药品标题 */
.drug-header h1 {
  margin-bottom: 0.5rem;
  color: #343a40;
  font-size: 2rem;
}
.drug-header p {
  margin-bottom: 0.3rem;
  color: #6c757d;
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
  font-size: 1.2rem;
  color: #495057;
}
.tab-content ul {
  padding-left: 20px;
  margin-bottom: 1rem;
}
.tab-content li {
  margin-bottom: 0.5rem;
}
.tab-content strong {
  color: #343a40;
}

/* 侧边栏 - 样式已移至 DrugSidebar.vue */
/* .sidebar-section { ... } */

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

/* Add some basic styling for lists within the sidebar */
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

/* 页脚样式 - 已移至 PageFooter.vue */
/* .page-footer { ... } */

/* Add styles for the comparison table */
.comparison-table-container {
  overflow-x: auto; /* Allow horizontal scrolling on small screens */
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px; /* Ensure table has a minimum width */
}

th,
td {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: top;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
}

tbody tr:nth-child(odd) {
  background-color: #f8f9fa;
}

tbody tr:hover {
  background-color: #e9ecef;
}

/* Optional: Add styles for inline links if needed */
.main-content a {
  /* color: #007bff; Match sidebar link color */
  text-decoration: none;
}

.main-content a:hover {
  text-decoration: underline;
}

/* Styles for Related Generics Section (Keep the container styles) */
.related-generics-swiper-container {
  position: relative;
  max-width: 700px; /* Adjust max-width */
  margin: 1rem auto 0 auto;
  /* Reduce padding to allow buttons to overlap slightly */
  padding: 0 35px;
}

.related-generics-swiper {
  width: 100%;
  overflow: hidden;
}

.swiper-slide {
  display: flex;
  justify-content: center;
  align-items: stretch; /* Allow cards to stretch vertically */
  box-sizing: border-box;
  min-height: auto; /* Reset min-height */
}

/* Remove link styling from the wrapper */
.related-generic-item-link {
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
}

/* Styles for the card inspired by the image */
.related-generic-item {
  display: flex;
  flex-direction: column; /* Stack content vertically */
  gap: 0.5rem; /* Reduced gap */
  padding: 1rem; /* Increased padding */
  border: 1px solid #e0e0e0; /* Slightly softer border */
  border-radius: 12px; /* More rounded corners */
  background-color: #ffffff; /* White background */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08); /* Subtle shadow */
  transition: box-shadow 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

/* Remove hover effect on the item itself */
/* .related-generic-item-link:hover .related-generic-item { ... } */

/* Remove old icon style */
/* .related-generic-icon { ... } */

/* Style for the title */
.related-generic-item h3 {
  font-size: 1rem; /* Made title slightly smaller */
  color: #0d6efd; /* Blue color like in the image */
  margin: 0 0 0.5rem 0; /* Adjust margin */
  font-weight: 600;
  line-height: 1.3;
}

/* Style for the description */
.related-generic-item p {
  font-size: 0.9rem;
  color: #555; /* Darker grey text */
  margin: 0 0 1rem 0; /* Adjust margin */
  line-height: 1.5;
  flex-grow: 1; /* Allow description to take available space */
}

/* Style for the 'View more' button */
.view-more-button {
  display: inline-block; /* Align like a button */
  background-color: #4a6fbd; /* Blue background like image */
  color: #ffffff;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin-top: auto; /* Pushes button to the bottom */
  align-self: stretch; /* Make button full width of card padding */
}

.view-more-button:hover {
  background-color: #3b5998; /* Darker blue on hover */
  text-decoration: none;
}

/* Swiper Navigation Buttons (Updated Styles) */
.swiper-button-prev,
.swiper-button-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px; /* Slightly smaller */
  height: 36px; /* Slightly smaller */
  background-color: #6c757d; /* Dark grey background */
  border-radius: 50%;
  color: #ffffff; /* White arrow color */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
  box-shadow: none; /* Remove shadow */
  z-index: 10;
}

.swiper-button-prev:hover,
.swiper-button-next:hover {
  background-color: #5a6268; /* Slightly darker grey on hover */
}

.swiper-button-prev {
  left: 0px; /* Position near left edge */
}

.swiper-button-next {
  right: 0px; /* Position near right edge */
}

/* Override default Swiper arrow styles */
.swiper-button-prev::after,
.swiper-button-next::after {
  font-size: 16px; /* Slightly smaller arrow */
  font-weight: bold;
}

/* Hide buttons if they are disabled */
.swiper-button-disabled {
  opacity: 0.25; /* Make disabled buttons more transparent */
  cursor: auto;
  pointer-events: none;
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
  /* Using :deep() to target component root element if necessary */
  .content-area > :deep(aside:first-of-type),
  .content-area > .side-nav-component {
    /* Add a class if needed */
    display: none;
  }

  /* Allow main content and right sidebar to take full width */
  .main-content {
    flex: 1; /* Reset flex basis for column layout */
    order: 1; /* Ensure main content is first */
  }

  /* Target DrugSidebar */
  /* Using :deep() to target component root element if necessary */
  .content-area > :deep(aside:last-of-type),
  .content-area > .drug-sidebar-component {
    /* Add a class if needed */
    flex: 1; /* Reset flex basis */
    width: 100%; /* Ensure it takes full width */
    order: 2; /* Place it after main content */
    /* Consider reducing internal margins/paddings within DrugSidebar itself for mobile if needed */
  }
}

/* --- Swiper Height Consistency --- */
.related-generics-swiper-container .swiper-wrapper {
  display: flex; /* Use flexbox for the wrapper */
  align-items: stretch; /* Stretch items to fill height */
}

.related-generics-swiper-container .swiper-slide {
  height: auto; /* Allow slides to determine their height based on content */
  display: flex; /* Make slides flex containers */
  flex-direction: column; /* Stack content vertically */
}

.related-generics-swiper-container .related-generic-item {
  flex-grow: 1; /* Allow the item content to grow and fill space */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Push button to bottom */
  padding: 1rem; /* Add padding */
  border: 1px solid #eee; /* Optional: add border for visual separation */
  border-radius: 8px;
  background-color: #f9f9f9;
  height: 100%; /* Ensure item takes full height of slide */
}

.related-generics-swiper-container .related-generic-item h3 {
  margin-top: 0;
}

.related-generics-swiper-container .view-more-button {
  margin-top: auto; /* Push button to the bottom */
  align-self: flex-start; /* Align button to the left */
}
/* --- End Swiper Height Consistency --- */
</style>