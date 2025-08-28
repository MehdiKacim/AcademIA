import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Frown, Home, ArrowLeft } from "lucide-react";
import { Button, MotionButton } from "@/components/ui/button"; // Import MotionButton
import Logo from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // console.error(
    //   "404 Error: User attempted to access non-existent route:",
    //   location.pathname,
    // );
  }, [location.pathname]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background blobs for immersive design */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-secondary/20 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <motion.div variants={itemVariants} className="mb-8">
        <Logo iconClassName="w-24 h-24" showText={false} />
      </motion.div>

      <motion.h1
        variants={itemVariants}
        className="text-6xl md:text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-background-pan mb-4"
      >
        404
      </motion.h1>

      <motion.p
        variants={itemVariants}
        className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-6 flex items-center gap-2"
      >
        <Frown className="h-8 w-8" /> Oops! Page non trouvée
      </motion.p>

      <motion.p
        variants={itemVariants}
        className="text-lg text-center text-muted-foreground max-w-md mb-8"
      >
        Il semblerait que la page que vous recherchez n'existe pas ou a été déplacée.
        Ne vous inquiétez pas, nous vous aidons à retrouver votre chemin.
      </motion.p>

      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <MotionButton onClick={() => navigate('/dashboard')} className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Home className="h-5 w-5" /> Retour au Tableau de bord
        </MotionButton>
        <MotionButton variant="outline" onClick={() => navigate(-1)} className="flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ArrowLeft className="h-5 w-5" /> Revenir en arrière
        </MotionButton>
      </motion.div>
    </motion.div>
  );
};

export default NotFound;