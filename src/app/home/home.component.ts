import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  carouselIndex = 0;
  private _interval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this._interval = setInterval(() => this.nextSlide(), 5000);
  }

  ngOnDestroy() {
    if (this._interval) clearInterval(this._interval);
  }

  goToAnalyze() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/analyze']);
    } else {
      this.router.navigate(['/register'], { queryParams: { returnUrl: '/analyze' } });
    }
  }

  nextSlide() {
    this.carouselIndex = (this.carouselIndex + 1) % this.testimonials.length;
  }

  prevSlide() {
    this.carouselIndex = (this.carouselIndex - 1 + this.testimonials.length) % this.testimonials.length;
  }

  goTo(i: number) {
    this.carouselIndex = i;
  }
  steps = [
    { icon: '📄', title: 'Upload Your Results', desc: 'Simply upload your academic report card or transcript in any format.' },
    { icon: '🤖', title: 'AI Analyzes Your Profile', desc: 'Our AI engine reads your strengths, weaknesses, and academic patterns instantly.' },
    { icon: '🚀', title: 'Discover Your Path', desc: 'Get a personalized list of careers perfectly matched to who you are.' }
  ];

  plans: { name: string; price: string; period: string; features: string[]; cta: string; highlight: boolean; plan: string }[] = [
    { name: 'Free', price: 'R0', period: 'forever', features: ['1 analysis only', 'Top 3 career matches', 'No feedback report'], cta: 'Start Free', highlight: false, plan: 'free' },
    { name: 'Pro', price: 'R99', period: 'per month', features: ['Unlimited analyses', 'All 5 career matches', 'Detailed AI feedback', 'Strengths & weaknesses', 'Alternative career paths'], cta: 'Go Pro', highlight: true, plan: 'pro' },
    { name: 'School', price: 'R499', period: 'per month', features: ['Up to 500 students', 'Bulk upload support', 'Teacher dashboard', 'Progress tracking', 'Priority support'], cta: 'Contact Us', highlight: false, plan: 'school' }
  ];

  testimonials = [
    { name: 'Thabo M.', grade: 'Grade 12 · Johannesburg', text: 'The full feedback report changed everything. I finally understood why I struggled in certain subjects and what careers would actually suit me.' },
    { name: 'Lerato K.', grade: 'Grade 11 · Pretoria', text: 'I upgraded to Pro and the alternative careers section showed me options I never even knew existed. Worth every cent.' },
    { name: 'Sipho N.', grade: 'Grade 12 · Durban', text: 'The strengths breakdown helped me convince my parents that engineering was the right path for me. The data spoke for itself.' },
    { name: 'Thapelo Moeketsi', grade: 'Grade 10 · HTS High School, Sasolburg', text: 'I tested PathlyAI with my actual results and it genuinely motivated me to study harder. Seeing my potential laid out like that made me realise I was capable of more than I thought.' },
    { name: 'Amahle D.', grade: 'Grade 11 · Cape Town', text: 'I always thought I was average, but PathlyAI showed me I have a natural strength in sciences. Now I am aiming for medicine and I actually believe I can do it.' },
    { name: 'Kgomotso R.', grade: 'Grade 12 · Soweto', text: 'My school does not have a career counsellor. PathlyAI gave me the guidance I never had access to. Every matric student needs this.' }
  ];
}
