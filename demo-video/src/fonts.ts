import {loadFont as loadGeist} from '@remotion/google-fonts/Geist';
import {loadFont as loadMono} from '@remotion/google-fonts/GeistMono';
import {loadFont as loadSerif} from '@remotion/google-fonts/InstrumentSerif';

loadGeist('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
loadMono('normal', {weights: ['400', '500', '600', '700'], subsets: ['latin']});
loadSerif('normal', {subsets: ['latin']});
loadSerif('italic', {subsets: ['latin']});
